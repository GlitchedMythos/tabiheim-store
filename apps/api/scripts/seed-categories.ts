import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  extendedData,
  presaleInfo,
  product,
  productCategory,
  productGroup,
} from '../src/db/schema';

/**
 * Seed script for TCG categories, groups, and products
 *
 * Fetches and seeds the 4 categories from tcgcsv.com that we support:
 * - Pokemon (3)
 * - Pokemon Japan (85)
 * - One-Piece (68)
 * - Lorcana (71)
 *
 * For each category, fetches and seeds all associated groups.
 * For each group, fetches and seeds all associated products with their
 * presale info and extended data.
 *
 * Updates records if modifiedOn date has changed (upsert logic).
 */

const TCGCSV_API_URL = 'https://tcgcsv.com/tcgplayer/categories';

// The category IDs we care about
const SUPPORTED_CATEGORY_IDS = [3, 85, 68, 71] as const;

// Performance tuning constants
const CONCURRENCY_LIMIT = 10; // Number of parallel API requests
const BATCH_SIZE = 500; // Number of products to insert at once

interface TCGCSVCategory {
  categoryId: number;
  name: string;
  displayName: string;
  modifiedOn: string;
  seoCategoryName: string;
  categoryDescription: string | null;
  categoryPageTitle: string;
  sealedLabel: string;
  nonSealedLabel: string | null;
  conditionGuideUrl: string;
  isScannable: boolean;
  popularity: number;
  isDirect: boolean;
}

interface TCGCSVResponse {
  totalItems: number;
  success: boolean;
  errors: string[];
  results: TCGCSVCategory[];
}

interface TCGCSVGroup {
  groupId: number;
  name: string;
  abbreviation: string;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

interface TCGCSVGroupResponse {
  totalItems: number;
  success: boolean;
  errors: string[];
  results: TCGCSVGroup[];
}

interface TCGCSVExtendedData {
  name: string;
  displayName: string;
  value: string;
}

interface TCGCSVPresaleInfo {
  isPresale: boolean;
  releasedOn: string | null;
  note: string | null;
}

interface TCGCSVProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  imageCount: number;
  presaleInfo: TCGCSVPresaleInfo;
  extendedData: TCGCSVExtendedData[];
}

interface TCGCSVProductResponse {
  totalItems: number;
  success: boolean;
  errors: string[];
  results: TCGCSVProduct[];
}

async function fetchCategories(): Promise<TCGCSVCategory[]> {
  console.log(`📡 Fetching categories from ${TCGCSV_API_URL}...`);

  const response = await fetch(TCGCSV_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch categories: ${response.status} ${response.statusText}`
    );
  }

  const data: TCGCSVResponse = await response.json();

  if (!data.success) {
    throw new Error(`API returned errors: ${data.errors.join(', ')}`);
  }

  console.log(`✅ Fetched ${data.totalItems} categories from API\n`);

  // Filter to only the categories we support
  const supportedCategories = data.results.filter((cat) =>
    (SUPPORTED_CATEGORY_IDS as readonly number[]).includes(
      cat.categoryId
    )
  );

  if (supportedCategories.length !== SUPPORTED_CATEGORY_IDS.length) {
    const foundIds = supportedCategories.map((c) => c.categoryId);
    const missingIds = SUPPORTED_CATEGORY_IDS.filter(
      (id) => !foundIds.includes(id)
    );
    console.warn(
      `⚠️  Warning: Could not find categories with IDs: ${missingIds.join(
        ', '
      )}`
    );
  }

  return supportedCategories;
}

async function fetchGroupsForCategory(
  categoryId: number
): Promise<TCGCSVGroup[]> {
  const url = `https://tcgcsv.com/tcgplayer/${categoryId}/groups`;
  console.log(`📡 Fetching groups for category ${categoryId}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch groups for category ${categoryId}: ${response.status} ${response.statusText}`
    );
  }

  const data: TCGCSVGroupResponse = await response.json();

  if (!data.success) {
    throw new Error(`API returned errors: ${data.errors.join(', ')}`);
  }

  console.log(
    `✅ Fetched ${data.totalItems} groups for category ${categoryId}`
  );

  return data.results;
}

async function fetchProductsForGroup(
  categoryId: number,
  groupId: number
): Promise<TCGCSVProduct[]> {
  const url = `https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/products`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products for group ${groupId}: ${response.status} ${response.statusText}`
    );
  }

  const data: TCGCSVProductResponse = await response.json();

  if (!data.success) {
    throw new Error(`API returned errors: ${data.errors.join(', ')}`);
  }

  return data.results;
}

/**
 * Extracts card number from extendedData array
 * Different categories use different names for the number field
 */
function extractCardNumber(
  extendedDataArray: TCGCSVExtendedData[]
): string | null {
  const numberEntry = extendedDataArray.find(
    (entry) => entry.name === 'Number'
  );
  return numberEntry?.value || null;
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

seedCategories();

async function seedCategories() {
  try {
    // Load environment variables
    if (process.env.ENVIRONMENT === 'production') {
      config({ path: './.prod.vars', override: true });
    } else {
      config({ path: './.dev.vars', override: true });
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error('Missing Environment Variable: DATABASE_URL');
    }

    // Fetch categories from tcgcsv.com API
    const categories = await fetchCategories();

    if (categories.length === 0) {
      console.warn('⚠️  No categories to seed. Exiting.');
      process.exit(0);
    }

    // Initialize database connection
    const client = neon(DATABASE_URL);
    const db = drizzle(client, {
      casing: 'snake_case',
    });

    console.log('🌱 Seeding TCG categories into database...\n');

    // Prepare category data for bulk insert
    const categoryData = categories.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      displayName: cat.displayName,
      modifiedOn: new Date(cat.modifiedOn),
    }));

    // Bulk insert/update categories (using excluded values for proper upserts)
    await db
      .insert(productCategory)
      .values(categoryData)
      .onConflictDoUpdate({
        target: productCategory.categoryId,
        set: {
          name: sql`excluded.name`,
          displayName: sql`excluded.display_name`,
          modifiedOn: sql`excluded.modified_on`,
        },
      });

    for (const cat of categories) {
      console.log(
        `✅ Upserted: ${cat.displayName} (ID: ${cat.categoryId})`
      );
    }

    console.log('\n🌱 Seeding TCG groups for each category...\n');

    // Fetch and bulk insert/update groups for each category
    for (const cat of categories) {
      try {
        const groups = await fetchGroupsForCategory(cat.categoryId);

        if (groups.length === 0) {
          console.log(`⏭️  No groups for ${cat.displayName}\n`);
          continue;
        }

        // Prepare group data for bulk insert
        const groupData = groups.map((grp) => ({
          groupId: grp.groupId,
          name: grp.name,
          abbreviation: grp.abbreviation,
          isSupplemental: grp.isSupplemental,
          publishedOn: new Date(grp.publishedOn),
          modifiedOn: new Date(grp.modifiedOn),
          categoryId: grp.categoryId,
        }));

        // Bulk upsert groups (using excluded values to update each group correctly)
        await db
          .insert(productGroup)
          .values(groupData)
          .onConflictDoUpdate({
            target: productGroup.groupId,
            set: {
              name: sql`excluded.name`,
              abbreviation: sql`excluded.abbreviation`,
              isSupplemental: sql`excluded.is_supplemental`,
              publishedOn: sql`excluded.published_on`,
              modifiedOn: sql`excluded.modified_on`,
              categoryId: sql`excluded.category_id`,
            },
          });

        console.log(
          `✅ Upserted ${groups.length} groups for ${cat.displayName}\n`
        );
      } catch (error) {
        console.error(
          `❌ Failed to fetch/seed groups for ${cat.name}:`,
          error
        );
        throw error; // Stop on first failure
      }
    }

    console.log('\n🌱 Seeding products for each category...\n');

    const startTime = Date.now();
    let totalProductsProcessed = 0;

    // Process each category
    for (const cat of categories) {
      try {
        console.log(
          `\n📦 Processing category: ${cat.displayName} (ID: ${cat.categoryId})`
        );
        const categoryStartTime = Date.now();

        // Fetch groups for this category
        const groups = await fetchGroupsForCategory(cat.categoryId);
        console.log(`   Found ${groups.length} groups to process`);

        // Fetch products for all groups in parallel
        console.log(
          `   🔄 Fetching products for all groups in parallel...`
        );
        const groupProducts = await fetchInParallel(
          groups,
          async (grp) => {
            try {
              const products = await fetchProductsForGroup(
                cat.categoryId,
                grp.groupId
              );
              return { group: grp, products, error: null };
            } catch (error) {
              console.error(
                `   ⚠️  Failed to fetch products for group ${grp.name}:`,
                error
              );
              return { group: grp, products: [], error };
            }
          }
        );

        // Flatten all products
        const allProducts = groupProducts.flatMap(
          (gp) => gp.products
        );
        console.log(
          `   ✅ Fetched ${allProducts.length} total products`
        );

        if (allProducts.length === 0) {
          console.log(
            `   ⏭️  No products to process for ${cat.displayName}`
          );
          continue;
        }

        // Process products in batches
        const productBatches = chunk(allProducts, BATCH_SIZE);
        console.log(
          `   📊 Processing ${productBatches.length} batches of up to ${BATCH_SIZE} products each...`
        );

        for (
          let batchIdx = 0;
          batchIdx < productBatches.length;
          batchIdx++
        ) {
          const batch = productBatches[batchIdx];
          const batchStartTime = Date.now();

          try {
            // Prepare product data
            const productData = batch.map((prod) => ({
              productId: prod.productId,
              name: prod.name,
              cleanName: prod.cleanName,
              cardNumber: extractCardNumber(prod.extendedData),
              imageUrl: prod.imageUrl,
              categoryId: prod.categoryId,
              groupId: prod.groupId,
              url: prod.url,
              modifiedOn: new Date(prod.modifiedOn),
              imageCount: prod.imageCount,
            }));

            // Bulk upsert products (using excluded values to update each product correctly)
            await db
              .insert(product)
              .values(productData)
              .onConflictDoUpdate({
                target: product.productId,
                set: {
                  name: sql`excluded.name`,
                  cleanName: sql`excluded.clean_name`,
                  cardNumber: sql`excluded.card_number`,
                  imageUrl: sql`excluded.image_url`,
                  categoryId: sql`excluded.category_id`,
                  groupId: sql`excluded.group_id`,
                  url: sql`excluded.url`,
                  modifiedOn: sql`excluded.modified_on`,
                  imageCount: sql`excluded.image_count`,
                },
              });

            // Prepare presale data
            const presaleData = batch
              .filter((prod) => prod.presaleInfo)
              .map((prod) => ({
                productId: prod.productId,
                isPresale: prod.presaleInfo.isPresale,
                releasedOn: prod.presaleInfo.releasedOn
                  ? new Date(prod.presaleInfo.releasedOn)
                  : null,
                note: prod.presaleInfo.note,
              }));

            // Bulk upsert presale info (using excluded values to update each correctly)
            if (presaleData.length > 0) {
              await db
                .insert(presaleInfo)
                .values(presaleData)
                .onConflictDoUpdate({
                  target: presaleInfo.productId,
                  set: {
                    isPresale: sql`excluded.is_presale`,
                    releasedOn: sql`excluded.released_on`,
                    note: sql`excluded.note`,
                  },
                });
            }

            // Handle extended data
            const productIds = batch.map((prod) => prod.productId);
            const allExtendedData = batch.flatMap((prod) =>
              prod.extendedData.map((ext) => ({
                productId: prod.productId,
                name: ext.name,
                displayName: ext.displayName,
                value: ext.value,
              }))
            );

            // Bulk delete existing extended data for this batch
            if (productIds.length > 0) {
              await db
                .delete(extendedData)
                .where(inArray(extendedData.productId, productIds));
            }

            // Bulk insert new extended data
            if (allExtendedData.length > 0) {
              // Split extended data into smaller chunks if needed (Postgres has parameter limits)
              const extendedDataChunks = chunk(allExtendedData, 1000);
              for (const extChunk of extendedDataChunks) {
                await db.insert(extendedData).values(extChunk);
              }
            }

            const batchTime = (
              (Date.now() - batchStartTime) /
              1000
            ).toFixed(2);
            const productsPerSecond = (
              batch.length / parseFloat(batchTime)
            ).toFixed(0);
            console.log(
              `   ✅ Batch ${batchIdx + 1}/${
                productBatches.length
              }: ${
                batch.length
              } products in ${batchTime}s (~${productsPerSecond} products/s)`
            );

            totalProductsProcessed += batch.length;
          } catch (error) {
            console.error(
              `   ❌ Failed to process batch ${batchIdx + 1}:`,
              error
            );
            throw error; // Stop on first failure as requested
          }
        }

        const categoryTime = (
          (Date.now() - categoryStartTime) /
          1000
        ).toFixed(2);
        console.log(
          `   🎉 Completed ${cat.displayName}: ${allProducts.length} products in ${categoryTime}s`
        );
      } catch (error) {
        console.error(
          `❌ Failed to process category ${cat.name}:`,
          error
        );
        throw error; // Stop on first failure
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const overallRate = (
      totalProductsProcessed / parseFloat(totalTime)
    ).toFixed(0);

    console.log(
      '\n✅ Category, group, and product seeding completed successfully!'
    );
    console.log(`\n📊 Summary:`);
    console.log(
      `   Total products processed: ${totalProductsProcessed}`
    );
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Average rate: ${overallRate} products/second`);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}
