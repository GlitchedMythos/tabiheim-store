import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { seedPricesFromArchive } from './lib/price-seeding';

/**
 * Historical Price Import Script
 *
 * Downloads and imports historical price archives from tcgcsv.com.
 * Iterates day-by-day from a specified start date to yesterday.
 *
 * Usage:
 *   pnpm run db:import-historical 2024-02-08
 *   pnpm run db:import-historical:prod 2024-02-08
 *
 * The script will:
 * 1. Download the archive for each date
 * 2. Extract it using 7z
 * 3. Import prices for all configured categories/groups
 * 4. Clean up extracted files
 * 5. Move to the next day
 *
 * If an archive doesn't exist (404), it logs a warning and continues.
 */

const ARCHIVE_BASE_URL = 'https://tcgcsv.com/archive/tcgplayer';
const TEMP_DIR = join(process.cwd(), '.temp-historical-import');

/**
 * Validates and parses a date string in YYYY-MM-DD format
 */
function parseDate(dateString: string): Date {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(
      `Invalid date format: ${dateString}. Expected format: YYYY-MM-DD`
    );
  }

  const date = new Date(dateString + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

/**
 * Formats a Date object as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Downloads an archive file from tcgcsv.com
 * Returns true if successful, false if 404 (not found)
 */
async function downloadArchive(
  dateString: string,
  outputPath: string
): Promise<boolean> {
  const archiveUrl = `${ARCHIVE_BASE_URL}/prices-${dateString}.ppmd.7z`;

  console.log(`\n📥 Downloading archive for ${dateString}...`);
  console.log(`   URL: ${archiveUrl}`);

  try {
    const response = await fetch(archiveUrl);

    if (response.status === 404) {
      console.log(
        `   ⚠️  Archive not found (404) - skipping this date`
      );
      return false;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to download archive: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to file using Node.js fs
    const fs = await import('node:fs/promises');
    await fs.writeFile(outputPath, buffer);

    console.log(
      `   ✅ Downloaded successfully (${buffer.length} bytes)`
    );
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log(
        `   ⚠️  Archive not found (404) - skipping this date`
      );
      return false;
    }
    throw error;
  }
}

/**
 * Extracts a 7z archive using the 7z command-line tool
 */
function extractArchive(
  archivePath: string,
  outputDir: string
): void {
  console.log(`\n📦 Extracting archive...`);
  console.log(`   Output directory: ${outputDir}`);

  try {
    // Create output directory if it doesn't exist
    mkdirSync(outputDir, { recursive: true });

    // Extract using 7z
    // -o specifies output directory (no space between -o and path)
    // -y assumes yes to all prompts
    execSync(`7z x "${archivePath}" -o"${outputDir}" -y`, {
      stdio: 'pipe', // Suppress 7z output
    });

    console.log(`   ✅ Extraction complete`);
  } catch (error) {
    console.error(`   ❌ Failed to extract archive:`, error);
    throw new Error(
      `7z extraction failed. Make sure 7z is installed and available in PATH.`
    );
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('❌ Error: Missing start date argument');
      console.error(
        '\nUsage: pnpm run db:import-historical YYYY-MM-DD'
      );
      console.error(
        'Example: pnpm run db:import-historical 2024-02-08'
      );
      process.exit(1);
    }

    const startDateString = args[0];
    const startDate = parseDate(startDateString);

    // Calculate yesterday (don't include today since current API handles that)
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    // Validate start date is not in the future
    if (startDate > yesterday) {
      console.error(
        `❌ Error: Start date ${startDateString} is in the future or today`
      );
      console.error('   Please provide a date in the past.');
      process.exit(1);
    }

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

    console.log('📅 TCG Historical Price Import Script\n');
    console.log(
      'Environment:',
      process.env.ENVIRONMENT || 'development'
    );
    console.log('Start date:', formatDate(startDate));
    console.log('End date:', formatDate(yesterday));

    // Calculate number of days
    const daysDiff = Math.floor(
      (yesterday.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    console.log(`Total days to process: ${daysDiff + 1}\n`);

    // Create temp directory
    console.log(`📁 Creating temporary directory: ${TEMP_DIR}`);
    mkdirSync(TEMP_DIR, { recursive: true });

    // Initialize database connection
    const client = neon(DATABASE_URL);
    const db = drizzle(client, {
      casing: 'snake_case',
    });

    // Iterate through each day
    let currentDate = new Date(startDate);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    while (currentDate <= yesterday) {
      const dateString = formatDate(currentDate);

      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing date: ${dateString}`);
        console.log('='.repeat(60));

        // Download archive
        const archivePath = join(
          TEMP_DIR,
          `prices-${dateString}.ppmd.7z`
        );
        const downloaded = await downloadArchive(
          dateString,
          archivePath
        );

        if (!downloaded) {
          skipCount++;
          // Move to next day
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          continue;
        }

        // Extract archive
        extractArchive(archivePath, TEMP_DIR);

        // Import prices
        const recordsInserted = await seedPricesFromArchive(
          db,
          TEMP_DIR,
          dateString
        );

        console.log(
          `\n✅ Successfully imported ${recordsInserted} price records for ${dateString}`
        );
        successCount++;

        // Clean up archive file and extracted files for this date
        console.log(`\n🧹 Cleaning up files for ${dateString}...`);
        try {
          rmSync(archivePath, { force: true });
          const extractedDateDir = join(TEMP_DIR, dateString);
          if (existsSync(extractedDateDir)) {
            rmSync(extractedDateDir, {
              recursive: true,
              force: true,
            });
          }
          console.log(`   ✅ Cleanup complete`);
        } catch (cleanupError) {
          console.warn(
            `   ⚠️  Failed to clean up some files:`,
            cleanupError
          );
          // Continue anyway
        }
      } catch (error) {
        console.error(`\n❌ Error processing ${dateString}:`, error);
        errorCount++;
        // Stop on errors (as per requirements)
        throw error;
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount} days`);
    console.log(`⚠️  Skipped (no archive): ${skipCount} days`);
    console.log(`❌ Errors: ${errorCount} days`);
    console.log(
      '\n✅ Historical price import completed successfully!'
    );
  } catch (error) {
    console.error(
      '\n❌ Error during historical price import:',
      error
    );
    process.exit(1);
  } finally {
    // Clean up temp directory
    console.log(`\n🧹 Cleaning up temporary directory...`);
    try {
      if (existsSync(TEMP_DIR)) {
        rmSync(TEMP_DIR, { recursive: true, force: true });
        console.log(`   ✅ Temporary directory removed`);
      }
    } catch (cleanupError) {
      console.warn(
        `   ⚠️  Failed to remove temp directory:`,
        cleanupError
      );
      console.warn(`   Please manually remove: ${TEMP_DIR}`);
    }
    process.exit(0);
  }
}

main();
