import { inArray } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  product,
  productGroup,
  productPrice,
  productSubtype,
} from '../../src/db/schema';

/**
 * Reusable price seeding functions
 *
 * These functions can be used for:
 * - Daily API fetching (using fetchLastUpdatedTimestamp)
 * - Archival data imports (passing historical recordedAt)
 */

// Performance tuning constants
const CONCURRENCY_LIMIT = 10; // Number of parallel API requests
const BATCH_SIZE = 500; // Number of records to insert at once

interface TCGCSVPriceData {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName: string;
}

interface TCGCSVPriceResponse {
  success: boolean;
  errors: string[];
  results: TCGCSVPriceData[];
}

interface GroupInfo {
  groupId: number;
  categoryId: number;
  name: string;
}

/**
 * Fetches the last updated timestamp from tcgcsv.com API
 * Format: 2025-11-11T20:07:06+0000
 */
export async function fetchLastUpdatedTimestamp(): Promise<Date> {
  const url = 'https://tcgcsv.com/last-updated.txt';
  console.log(`📡 Fetching last updated timestamp from ${url}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch last updated timestamp: ${response.status} ${response.statusText}`
    );
  }

  const timestampText = await response.text();
  const trimmedTimestamp = timestampText.trim();

  console.log(`✅ Last updated: ${trimmedTimestamp}`);

  return new Date(trimmedTimestamp);
}

/**
 * Fetches prices for a specific group from tcgcsv.com API
 */
export async function fetchPricesForGroup(
  categoryId: number,
  groupId: number
): Promise<TCGCSVPriceData[]> {
  const url = `https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/prices`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch prices for group ${groupId}: ${response.status} ${response.statusText}`
    );
  }

  const data: TCGCSVPriceResponse = await response.json();

  if (!data.success) {
    throw new Error(`API returned errors: ${data.errors.join(', ')}`);
  }

  return data.results;
}

/**
 * Execute async tasks in parallel with concurrency limit
 * Prevents overwhelming the API while maximizing throughput
 */
async function fetchInParallel<T, R>(
  items: T[],
  fetchFn: (item: T) => Promise<R>,
  concurrency: number = CONCURRENCY_LIMIT
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function executeNext(): Promise<void> {
    if (index >= items.length) return;

    const currentIndex = index++;
    const item = items[currentIndex];

    try {
      const result = await fetchFn(item);
      results[currentIndex] = result;
    } catch (error) {
      throw error;
    }

    await executeNext();
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => executeNext());

  await Promise.all(workers);
  return results;
}

/**
 * Split array into chunks of specified size
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Main price seeding function
 *
 * @param db - Drizzle database instance
 * @param recordedAt - Timestamp to use for price records (defaults to now)
 * @returns Number of price records inserted
 */
export async function seedPrices(
  db: NeonHttpDatabase,
  recordedAt: Date = new Date()
): Promise<number> {
  console.log('\n🌱 Starting price seeding process...');
  console.log(
    `   Recording prices with timestamp: ${recordedAt.toISOString()}`
  );

  const startTime = Date.now();
  let totalPricesInserted = 0;

  try {
    // Fetch all groups from the database
    console.log('\n📊 Fetching all product groups from database...');
    const allGroups = await db
      .select({
        groupId: productGroup.groupId,
        categoryId: productGroup.categoryId,
        name: productGroup.name,
      })
      .from(productGroup);

    // Filter out groups without a categoryId
    const groups = allGroups.filter(
      (g): g is GroupInfo => g.categoryId !== null
    );

    console.log(`✅ Found ${groups.length} groups to process\n`);

    if (groups.length === 0) {
      console.warn(
        '⚠️  No groups found in database. Run seed-products first.'
      );
      return 0;
    }

    // Fetch prices for all groups in parallel
    console.log('🔄 Fetching prices for all groups in parallel...');
    const groupPrices = await fetchInParallel(
      groups,
      async (group: GroupInfo) => {
        try {
          const prices = await fetchPricesForGroup(
            group.categoryId,
            group.groupId
          );
          return { group, prices, error: null };
        } catch (error) {
          console.error(
            `   ⚠️  Failed to fetch prices for group ${group.name}:`,
            error
          );
          return { group, prices: [], error };
        }
      }
    );

    // Flatten all prices
    const allPrices = groupPrices.flatMap((gp) => gp.prices);
    console.log(
      `✅ Fetched ${allPrices.length} total price records\n`
    );

    if (allPrices.length === 0) {
      console.log('⏭️  No prices to process');
      return 0;
    }

    // Process prices in batches
    const priceBatches = chunk(allPrices, BATCH_SIZE);
    console.log(
      `📊 Processing ${priceBatches.length} batches of up to ${BATCH_SIZE} records each...\n`
    );

    for (
      let batchIdx = 0;
      batchIdx < priceBatches.length;
      batchIdx++
    ) {
      const batch = priceBatches[batchIdx];
      const batchStartTime = Date.now();

      try {
        // Step 1: Upsert product subtypes
        const subtypeData = batch.map((price) => ({
          productId: price.productId,
          subTypeName: price.subTypeName,
        }));

        // Remove duplicates within the batch
        const uniqueSubtypes = Array.from(
          new Map(
            subtypeData.map((item) => [
              `${item.productId}-${item.subTypeName}`,
              item,
            ])
          ).values()
        );

        await db
          .insert(productSubtype)
          .values(uniqueSubtypes)
          .onConflictDoNothing({
            target: [
              productSubtype.productId,
              productSubtype.subTypeName,
            ],
          });

        // Step 2: Fetch the subtype IDs we just inserted/updated
        const productIds = Array.from(
          new Set(batch.map((price) => price.productId))
        );

        const subtypeRecords = await db
          .select({
            id: productSubtype.id,
            productId: productSubtype.productId,
            subTypeName: productSubtype.subTypeName,
          })
          .from(productSubtype)
          .where(inArray(productSubtype.productId, productIds));

        // Create a map for quick lookup
        const subtypeMap = new Map<string, number>();
        for (const record of subtypeRecords) {
          const key = `${record.productId}-${record.subTypeName}`;
          subtypeMap.set(key, record.id);
        }

        // Step 3: Prepare price data with subtype IDs
        const priceData = batch
          .map((price) => {
            const key = `${price.productId}-${price.subTypeName}`;
            const subtypeId = subtypeMap.get(key);

            if (!subtypeId) {
              console.warn(
                `   ⚠️  Could not find subtype ID for product ${price.productId} with subtype ${price.subTypeName}`
              );
              return null;
            }

            return {
              productSubtypeId: subtypeId,
              recordedAt,
              lowPrice: price.lowPrice?.toString() || null,
              midPrice: price.midPrice?.toString() || null,
              highPrice: price.highPrice?.toString() || null,
              marketPrice: price.marketPrice?.toString() || null,
              directLowPrice:
                price.directLowPrice?.toString() || null,
            };
          })
          .filter(
            (item): item is NonNullable<typeof item> => item !== null
          );

        // Step 4: Insert price records
        if (priceData.length > 0) {
          await db.insert(productPrice).values(priceData);
          totalPricesInserted += priceData.length;
        }

        const batchTime = (
          (Date.now() - batchStartTime) /
          1000
        ).toFixed(2);
        const recordsPerSecond = (
          batch.length / parseFloat(batchTime)
        ).toFixed(0);
        console.log(
          `   ✅ Batch ${batchIdx + 1}/${priceBatches.length}: ${
            batch.length
          } records in ${batchTime}s (~${recordsPerSecond} records/s)`
        );
      } catch (error) {
        console.error(
          `   ❌ Failed to process batch ${batchIdx + 1}:`,
          error
        );
        throw error;
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const overallRate = (
      totalPricesInserted / parseFloat(totalTime)
    ).toFixed(0);

    console.log('\n✅ Price seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(
      `   Total price records inserted: ${totalPricesInserted}`
    );
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Average rate: ${overallRate} records/second`);

    return totalPricesInserted;
  } catch (error) {
    console.error('\n❌ Error during price seeding:', error);
    throw error;
  }
}

/**
 * Reads prices from a local JSON file (archive format)
 *
 * @param filePath - Path to the prices JSON file
 * @returns Array of price data, or empty array if file doesn't exist
 */
export async function readPricesFromFile(
  filePath: string
): Promise<TCGCSVPriceData[]> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const data: TCGCSVPriceResponse = JSON.parse(fileContent);

    if (!data.success) {
      console.warn(
        `   ⚠️  File ${filePath} returned errors: ${data.errors.join(
          ', '
        )}`
      );
      return [];
    }

    return data.results;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist - this is expected for some groups
      return [];
    }
    // Re-throw other errors (parsing errors, permission errors, etc.)
    throw error;
  }
}

/**
 * Helper function to process price batches and insert into database
 * Shared logic between seedPrices and seedPricesFromArchive
 */
async function processPriceBatches(
  db: NeonHttpDatabase,
  allPrices: TCGCSVPriceData[],
  recordedAt: Date
): Promise<number> {
  let totalPricesInserted = 0;
  const missingProductIds = new Set<number>();

  if (allPrices.length === 0) {
    console.log('⏭️  No prices to process');
    return 0;
  }

  // Process prices in batches
  const priceBatches = chunk(allPrices, BATCH_SIZE);
  console.log(
    `📊 Processing ${priceBatches.length} batches of up to ${BATCH_SIZE} records each...\n`
  );

  for (let batchIdx = 0; batchIdx < priceBatches.length; batchIdx++) {
    const batch = priceBatches[batchIdx];
    const batchStartTime = Date.now();

    try {
      // Step 1: Check which products exist in the database
      const productIds = Array.from(
        new Set(batch.map((price) => price.productId))
      );

      const existingProducts = await db
        .select({
          productId: product.productId,
        })
        .from(product)
        .where(inArray(product.productId, productIds));

      const existingProductIds = new Set(
        existingProducts.map((p) => p.productId)
      );

      // Identify missing products
      const batchMissingProducts = productIds.filter(
        (id) => !existingProductIds.has(id)
      );

      if (batchMissingProducts.length > 0) {
        batchMissingProducts.forEach((id) =>
          missingProductIds.add(id)
        );
      }

      // Filter batch to only include prices for existing products
      const validBatch = batch.filter((price) =>
        existingProductIds.has(price.productId)
      );

      if (validBatch.length === 0) {
        console.log(
          `   ⚠️  Batch ${batchIdx + 1}/${priceBatches.length}: All ${
            batch.length
          } products missing - skipped`
        );
        continue;
      }

      // Step 2: Upsert product subtypes (only for valid products)
      const subtypeData = validBatch.map((price) => ({
        productId: price.productId,
        subTypeName: price.subTypeName,
      }));

      // Remove duplicates within the batch
      const uniqueSubtypes = Array.from(
        new Map(
          subtypeData.map((item) => [
            `${item.productId}-${item.subTypeName}`,
            item,
          ])
        ).values()
      );

      await db
        .insert(productSubtype)
        .values(uniqueSubtypes)
        .onConflictDoNothing({
          target: [
            productSubtype.productId,
            productSubtype.subTypeName,
          ],
        });

      // Step 3: Fetch the subtype IDs we just inserted/updated
      const validProductIds = Array.from(
        new Set(validBatch.map((price) => price.productId))
      );

      const subtypeRecords = await db
        .select({
          id: productSubtype.id,
          productId: productSubtype.productId,
          subTypeName: productSubtype.subTypeName,
        })
        .from(productSubtype)
        .where(inArray(productSubtype.productId, validProductIds));

      // Create a map for quick lookup
      const subtypeMap = new Map<string, number>();
      for (const record of subtypeRecords) {
        const key = `${record.productId}-${record.subTypeName}`;
        subtypeMap.set(key, record.id);
      }

      // Step 4: Prepare price data with subtype IDs
      const priceData = validBatch
        .map((price) => {
          const key = `${price.productId}-${price.subTypeName}`;
          const subtypeId = subtypeMap.get(key);

          if (!subtypeId) {
            console.warn(
              `   ⚠️  Could not find subtype ID for product ${price.productId} with subtype ${price.subTypeName}`
            );
            return null;
          }

          return {
            productSubtypeId: subtypeId,
            recordedAt,
            lowPrice: price.lowPrice?.toString() || null,
            midPrice: price.midPrice?.toString() || null,
            highPrice: price.highPrice?.toString() || null,
            marketPrice: price.marketPrice?.toString() || null,
            directLowPrice: price.directLowPrice?.toString() || null,
          };
        })
        .filter(
          (item): item is NonNullable<typeof item> => item !== null
        );

      // Step 5: Insert price records
      if (priceData.length > 0) {
        await db.insert(productPrice).values(priceData);
        totalPricesInserted += priceData.length;
      }

      const batchTime = (
        (Date.now() - batchStartTime) /
        1000
      ).toFixed(2);
      const recordsPerSecond = (
        validBatch.length / parseFloat(batchTime)
      ).toFixed(0);

      const skippedCount = batch.length - validBatch.length;
      const statusMsg =
        skippedCount > 0
          ? `${validBatch.length} records (${skippedCount} skipped - missing products)`
          : `${validBatch.length} records`;

      console.log(
        `   ✅ Batch ${batchIdx + 1}/${
          priceBatches.length
        }: ${statusMsg} in ${batchTime}s (~${recordsPerSecond} records/s)`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to process batch ${batchIdx + 1}:`,
        error
      );
      throw error;
    }
  }

  // Log missing products summary
  if (missingProductIds.size > 0) {
    console.log(
      `\n⚠️  Warning: ${missingProductIds.size} products not found in database`
    );
    console.log('   Missing product IDs:');
    const sortedMissing = Array.from(missingProductIds).sort(
      (a, b) => a - b
    );
    // Log in groups of 10 for readability
    for (let i = 0; i < sortedMissing.length; i += 10) {
      const group = sortedMissing.slice(i, i + 10);
      console.log(`   ${group.join(', ')}`);
    }
  }

  return totalPricesInserted;
}

/**
 * Seeds prices from archive files (for historical data imports)
 *
 * @param db - Drizzle database instance
 * @param archivePath - Root path to extracted archive (e.g., "/tmp/tcg-archive")
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Number of price records inserted
 */
export async function seedPricesFromArchive(
  db: NeonHttpDatabase,
  archivePath: string,
  dateString: string
): Promise<number> {
  console.log('\n🌱 Starting archive price seeding process...');
  console.log(`   Archive path: ${archivePath}`);
  console.log(`   Date: ${dateString}`);

  const startTime = Date.now();
  const recordedAt = new Date(dateString + 'T00:00:00Z');

  try {
    // Fetch all groups from the database
    console.log('\n📊 Fetching all product groups from database...');
    const allGroups = await db
      .select({
        groupId: productGroup.groupId,
        categoryId: productGroup.categoryId,
        name: productGroup.name,
      })
      .from(productGroup);

    // Filter out groups without a categoryId
    const groups = allGroups.filter(
      (g): g is GroupInfo => g.categoryId !== null
    );

    console.log(`✅ Found ${groups.length} groups to process\n`);

    if (groups.length === 0) {
      console.warn(
        '⚠️  No groups found in database. Run seed-products first.'
      );
      return 0;
    }

    // Read prices from archive files for all groups
    console.log('🔄 Reading prices from archive files...');
    const allPrices: TCGCSVPriceData[] = [];
    let filesRead = 0;
    let filesSkipped = 0;

    for (const group of groups) {
      const priceFilePath = join(
        archivePath,
        dateString,
        group.categoryId.toString(),
        group.groupId.toString(),
        'prices'
      );

      const prices = await readPricesFromFile(priceFilePath);
      if (prices.length > 0) {
        allPrices.push(...prices);
        filesRead++;
      } else {
        filesSkipped++;
      }
    }

    console.log(
      `✅ Read ${allPrices.length} total price records from ${filesRead} files (${filesSkipped} files skipped)\n`
    );

    // Process prices using shared batch processing logic
    const totalPricesInserted = await processPriceBatches(
      db,
      allPrices,
      recordedAt
    );

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const overallRate = (
      totalPricesInserted / parseFloat(totalTime)
    ).toFixed(0);

    console.log('\n✅ Archive price seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(
      `   Total price records inserted: ${totalPricesInserted}`
    );
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Average rate: ${overallRate} records/second`);

    return totalPricesInserted;
  } catch (error) {
    console.error('\n❌ Error during archive price seeding:', error);
    throw error;
  }
}
