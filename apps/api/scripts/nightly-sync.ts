import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { execSync } from 'node:child_process';
import {
  fetchLastUpdatedTimestamp,
  seedPrices,
} from './lib/price-seeding';

/**
 * Nightly sync script
 *
 * This script runs the complete daily sync process:
 * 1. Seeds products (categories, groups, products) from tcgcsv.com
 * 2. Seeds prices for all products
 *
 * Designed to be run as a scheduled job (e.g., cron, GitHub Actions)
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

    console.log('🌙 TCG Nightly Sync Script\n');
    console.log('Environment:', process.env.ENVIRONMENT || 'development');
    console.log('Started at:', new Date().toISOString());
    console.log('─'.repeat(60));

    // Step 1: Seed products (categories, groups, products)
    console.log('\n📦 Step 1/2: Seeding products...\n');
    try {
      const env = process.env.ENVIRONMENT === 'production' ? 'ENVIRONMENT=production' : '';
      const command = env
        ? `cross-env ${env} tsx scripts/seed-products.ts`
        : 'tsx scripts/seed-products.ts';

      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('\n✅ Product seeding completed successfully');
    } catch (error) {
      console.error('\n❌ Product seeding failed:', error);
      throw new Error('Product seeding failed. Aborting nightly sync.');
    }

    console.log('\n' + '─'.repeat(60));

    // Step 2: Seed prices
    console.log('\n💰 Step 2/2: Seeding prices...\n');
    try {
      // Fetch the last updated timestamp from the API
      const recordedAt = await fetchLastUpdatedTimestamp();

      // Initialize database connection
      const client = neon(DATABASE_URL);
      const db = drizzle(client, {
        casing: 'snake_case',
      });

      // Seed prices using the fetched timestamp
      await seedPrices(db, recordedAt);
      console.log('\n✅ Price seeding completed successfully');
    } catch (error) {
      console.error('\n❌ Price seeding failed:', error);
      throw new Error('Price seeding failed. Aborting nightly sync.');
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n🎉 Nightly sync completed successfully!');
    console.log('Finished at:', new Date().toISOString());
  } catch (error) {
    console.error('\n❌ Nightly sync failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

