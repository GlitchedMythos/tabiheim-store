import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  fetchLastUpdatedTimestamp,
  seedPrices,
} from './lib/price-seeding';

/**
 * Price seeding script
 *
 * Fetches current prices from tcgcsv.com API and seeds them into the database.
 * Uses the last-updated timestamp from the API as the recordedAt timestamp.
 *
 * This script should be run daily to keep prices up to date.
 */

async function main() {
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

    console.log('🌱 TCG Price Seeding Script\n');
    console.log('Environment:', process.env.ENVIRONMENT || 'development');

    // Fetch the last updated timestamp from the API
    const recordedAt = await fetchLastUpdatedTimestamp();

    // Initialize database connection
    const client = neon(DATABASE_URL);
    const db = drizzle(client, {
      casing: 'snake_case',
    });

    // Seed prices using the fetched timestamp
    await seedPrices(db, recordedAt);

    console.log('\n✅ Price seeding script completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during price seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

