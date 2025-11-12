# TCG Data Seeding Scripts

This directory contains scripts for seeding and maintaining TCG (Trading Card Game) product and price data from the [tcgcsv.com API](https://tcgcsv.com).

## Overview

The seeding system consists of four main components:

1. **Product Seeding** - Fetches categories, groups, and products
2. **Price Seeding** - Fetches current prices for all products
3. **Nightly Sync** - Orchestrates both product and price seeding
4. **Historical Import** - One-time import of historical price archives

## Scripts

### 1. `seed-products.ts`

**Purpose**: Fetches and seeds all TCG product data from tcgcsv.com

**What it does**:
- Fetches 4 supported categories: Pokemon (3), Pokemon Japan (85), One-Piece (68), Lorcana (71)
- For each category, fetches all associated groups (sets/expansions)
- For each group, fetches all products (individual cards)
- Upserts all data into the database (updates if modified, inserts if new)

**Tables populated**:
- `product_category` - Game categories (Pokemon, One-Piece, etc.)
- `product_group` - Sets/expansions within each category
- `product` - Individual cards/products
- `presale_info` - Pre-release information
- `extended_data` - Additional metadata (card attributes, rarity, etc.)

**Performance**:
- Uses parallel fetching (10 concurrent requests by default)
- Batch inserts (500 products per batch)
- Typical runtime: ~5-10 minutes depending on data volume

**Usage**:
```bash
# Development
pnpm run db:seed:categories

# Production
pnpm run db:seed:categories:prod
```

**Important notes**:
- Products are identified by `productId` from the API (immutable)
- Updates existing records based on `modifiedOn` timestamp
- Extended data is completely replaced on each run (delete + insert)

---

### 2. `seed-prices.ts`

**Purpose**: Fetches and records current market prices for all products

**What it does**:
- Fetches the authoritative timestamp from `https://tcgcsv.com/last-updated.txt`
- Retrieves all product groups from the database
- For each group, fetches current prices
- Creates/updates product subtypes (Normal, Holofoil, Reverse Holofoil, etc.)
- Inserts price records with the API timestamp

**Tables populated**:
- `product_subtype` - Product variants (Normal, Holofoil, etc.)
- `product_price` - Time-series price data

**Key concepts**:

#### Product Subtypes
A single product can have multiple subtypes with different prices:
- `productId: 565220, subTypeName: "Normal"` - $2.71
- `productId: 565220, subTypeName: "Holofoil"` - $15.50

The script automatically:
1. Discovers all subtypes from the API
2. Creates subtype records in `product_subtype`
3. Links prices to the appropriate subtype via `product_subtype_id`

#### Price History
Prices are **appended**, not updated. Each run creates new records with `recorded_at` timestamp:
```
product_subtype_id | recorded_at          | market_price
------------------+---------------------+-------------
123               | 2025-11-11 20:07:06 | 2.71
123               | 2025-11-12 20:15:32 | 2.85
123               | 2025-11-13 20:02:18 | 2.90
```

This enables:
- Price trend analysis
- Historical price queries
- Market volatility tracking

**Performance**:
- Parallel fetching (10 concurrent requests)
- Batch inserts (500 records per batch)
- Typical runtime: ~30-60 seconds for ~75,000 price records

**Usage**:
```bash
# Development
pnpm run db:seed:prices

# Production
pnpm run db:seed:prices:prod
```

**Important notes**:
- Always uses timestamp from `last-updated.txt` for consistency
- Requires products to exist (run `seed-products.ts` first)
- Safe to run multiple times per day (creates new records each time)

---

### 3. `nightly-sync.ts`

**Purpose**: Complete daily sync of products and prices

**What it does**:
1. Runs `seed-products.ts` to ensure product catalog is up-to-date
2. If successful, runs price seeding
3. Stops on first failure with clear error messages

**Usage**:
```bash
# Development
pnpm run db:nightly-sync

# Production
pnpm run db:nightly-sync:prod
```

**When to use**:
- Daily scheduled jobs (cron, GitHub Actions, etc.)
- Ensures both products AND prices are current
- Recommended for production environments

**Error handling**:
- If product seeding fails, price seeding is skipped
- Clear separation of concerns with detailed logging
- Non-zero exit codes on failure for CI/CD integration

---

### 4. `import-historical-prices.ts`

**Purpose**: One-time import of historical price data from tcgcsv.com archives

**What it does**:
- Downloads daily price archives from tcgcsv.com (7z compressed files)
- Extracts archives using the 7z command-line tool
- Imports prices for all configured categories and groups
- Iterates day-by-day from a specified start date to yesterday
- Handles missing archives gracefully (logs warning and continues)

**Tables populated**:
- `product_subtype` - Product variants (if not already present)
- `product_price` - Historical time-series price data

**Requirements**:
- **7z command-line tool** must be installed and available in PATH
  - Windows: Download from [7-zip.org](https://www.7-zip.org/)
  - macOS: `brew install p7zip`
  - Linux: `apt install p7zip-full` or `yum install p7zip`
- Products must already exist in database (run `seed-products.ts` first)

**Usage**:
```bash
# Development - import from specific start date
pnpm run db:import-historical 2024-02-08

# Production
pnpm run db:import-historical:prod 2024-02-08
```

**How it works**:
1. Validates the provided start date (must be in YYYY-MM-DD format)
2. Creates a temporary directory for downloads/extraction
3. For each day from start date to yesterday:
   - Downloads `https://tcgcsv.com/archive/tcgplayer/prices-YYYY-MM-DD.ppmd.7z`
   - If archive doesn't exist (404), logs a warning and skips to next day
   - Extracts the archive to temp directory
   - Reads price files from extracted structure: `YYYY-MM-DD/{categoryId}/{groupId}/prices`
   - Imports prices with the archive date as `recorded_at` timestamp
   - Cleans up downloaded and extracted files for that date
4. Removes temporary directory on completion

**Performance**:
- Batch inserts (500 records per batch)
- Sequential processing (one day at a time to manage disk space)
- Typical runtime: ~1-2 minutes per day (depends on archive size and network speed)

**Important notes**:
- **One-time use**: This script is designed for initial historical data import
- **Date range**: Processes from start date through yesterday (not today)
- **Archive availability**: Not all dates may have archives available
- **Missing products**: If price data references products not in your database, those prices are skipped and logged
- **Product sync**: Run `db:seed:products` first to ensure your product catalog is up-to-date
- **Stops on errors**: Database or extraction errors will halt the script
- **Cleanup**: Temporary files are automatically cleaned up after each day
- **Disk space**: Only one day's archive is on disk at a time (~50-100MB compressed)

**Example output**:
```
📅 TCG Historical Price Import Script

Environment: development
Start date: 2024-02-08
End date: 2025-11-11
Total days to process: 278

============================================================
Processing date: 2024-02-08
============================================================

📥 Downloading archive for 2024-02-08...
   ✅ Downloaded successfully (52,487,392 bytes)

📦 Extracting archive...
   ✅ Extraction complete

🌱 Starting archive price seeding process...
   Archive path: .temp-historical-import
   Date: 2024-02-08

📊 Fetching all product groups from database...
✅ Found 156 groups to process

🔄 Reading prices from archive files...
✅ Read 73,245 total price records from 142 files (14 files skipped)

📊 Processing 147 batches of up to 500 records each...
   ✅ Batch 1/147: 500 records in 0.85s (~588 records/s)
   ✅ Batch 2/147: 487 records (13 skipped - missing products) in 0.72s (~676 records/s)
   ...

⚠️  Warning: 42 products not found in database
   Missing product IDs:
   123456, 234567, 345678, 456789, 567890, 678901, 789012, 890123, 901234, 112345
   ...

✅ Successfully imported 73,203 price records for 2024-02-08

🧹 Cleaning up files for 2024-02-08...
   ✅ Cleanup complete
```

**Troubleshooting**:

**"7z is not recognized as a command"**
- Cause: 7z command-line tool is not installed or not in PATH
- Solution: Install 7z and ensure it's available in your system PATH

**"Archive not found (404)"**
- Cause: No archive exists for that specific date
- Effect: The date is skipped, and processing continues to the next day
- This is normal behavior - not all dates have archives

**"No groups found in database"**
- Cause: Product catalog hasn't been seeded yet
- Solution: Run `pnpm run db:seed:products` first

**"X products not found in database" warnings**
- Cause: Historical price data references products not in your current database
- Effect: Prices for those products are skipped, but import continues
- Solution: This is normal - historical data may reference discontinued products or products added after the archive date. The missing product IDs are logged for your reference.

**Script stops with database error**
- Cause: Database connection issues or other constraint violations
- Solution: Check database connectivity and ensure schema is up to date

---

## Reusable Functions

### `lib/price-seeding.ts`

This module contains reusable functions designed for both API and archival use:

#### `fetchLastUpdatedTimestamp(): Promise<Date>`
Fetches the authoritative timestamp from tcgcsv.com API

#### `fetchPricesForGroup(categoryId: number, groupId: number): Promise<TCGCSVPriceData[]>`
Fetches prices for a specific group from the API

#### `seedPrices(db: NeonHttpDatabase, recordedAt?: Date): Promise<number>`
Main seeding logic for API-based price imports with optional timestamp parameter

**API usage example**:
```typescript
import { seedPrices, fetchLastUpdatedTimestamp } from './lib/price-seeding';

// Fetch current prices from API
const timestamp = await fetchLastUpdatedTimestamp();
await seedPrices(db, timestamp);
```

#### `readPricesFromFile(filePath: string): Promise<TCGCSVPriceData[]>`
Reads and parses price data from a local JSON file (archive format). Returns an empty array if the file doesn't exist, making it safe to use when iterating through groups where some may not have price data.

#### `seedPricesFromArchive(db: NeonHttpDatabase, archivePath: string, dateString: string): Promise<number>`
Main seeding logic for file-based historical imports. Reads price files from extracted archive directory structure and imports them with the specified date as the timestamp.

**Archive import usage example**:
```typescript
import { seedPricesFromArchive } from './lib/price-seeding';

// Import prices from extracted archive
const recordsInserted = await seedPricesFromArchive(
  db,
  '/path/to/extracted/archive',
  '2024-02-08'
);
```

This design enables both real-time API imports and historical data imports from 7zip archives while reusing all the core batching and database logic.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     tcgcsv.com API                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ├─── /tcgplayer/categories
                           ├─── /tcgplayer/{categoryId}/groups
                           ├─── /tcgplayer/{categoryId}/{groupId}/products
                           ├─── /tcgplayer/{categoryId}/{groupId}/prices
                           └─── /last-updated.txt
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌────────────────┐                   ┌────────────────┐
│ seed-products  │                   │  seed-prices   │
└────────────────┘                   └────────────────┘
        │                                     │
        ├─── product_category                 ├─── product_subtype
        ├─── product_group                    └─── product_price
        ├─── product
        ├─── presale_info
        └─── extended_data
                           │
                           ▼
                  ┌────────────────┐
                  │   Database     │
                  │  (Neon/Postgres)
                  └────────────────┘
```

---

## Performance Tuning

### Concurrency Control
Both scripts use parallel fetching with a default limit of 10 concurrent requests:

```typescript
const CONCURRENCY_LIMIT = 10; // Adjustable in each script
```

**Considerations**:
- Higher = faster but may overwhelm API
- Lower = slower but more stable
- Current setting is conservative for reliability

### Batch Sizes
Database inserts are batched for efficiency:

```typescript
const BATCH_SIZE = 500; // Adjustable in each script
```

**Considerations**:
- Postgres has parameter limits (~65,535 parameters)
- Each product has ~10 fields = ~5,000 products max per batch
- Current setting balances speed vs. memory usage

---

## Database Schema Notes

### Primary Keys
- `product_category.category_id` - From API (immutable)
- `product_group.group_id` - From API (immutable)
- `product.product_id` - From API (immutable)

These are **external identifiers** that never change, making them safe as primary keys.

### Unique Constraints
- `product_subtype(product_id, sub_type_name)` - Prevents duplicate subtypes
- Enables upsert logic with `onConflictDoNothing()`

### TimescaleDB Compatibility
The `product_price` table uses a composite primary key including `recorded_at`:

```typescript
primaryKey({ columns: [table.id, table.recordedAt] })
```

This is required for TimescaleDB hypertables if you choose to use them for time-series optimization.

---

## Troubleshooting

### "No products found in database"
**Cause**: Trying to run price seeding before product seeding
**Solution**: Run `seed-products.ts` first, or use `nightly-sync.ts`

### "ON CONFLICT specification" error
**Cause**: Database migration not applied
**Solution**: Run `pnpm run db:migrate` to apply schema changes

### Slow performance
**Causes**:
- Network latency to API
- Database connection issues
- Large data volumes

**Solutions**:
- Check network connectivity
- Increase `CONCURRENCY_LIMIT` (carefully)
- Verify database performance

### API rate limiting
**Symptom**: Frequent 429 errors or timeouts
**Solution**: Decrease `CONCURRENCY_LIMIT` to reduce request rate

---

## Environment Variables

Required in `.dev.vars` (development) or `.prod.vars` (production):

```bash
DATABASE_URL=postgresql://user:pass@host/db
```

Set `ENVIRONMENT=production` to use production vars:
```bash
cross-env ENVIRONMENT=production tsx scripts/seed-prices.ts
```

---

## Future Enhancements

### Incremental Updates
Currently, the scripts fetch all data. Future optimization:
- Store `last-updated.txt` timestamp in database
- Only fetch if timestamp has changed
- Reduces API load and runtime

---

## Best Practices

1. **Run product seeding first** - Prices depend on products existing
2. **Use nightly-sync for scheduled jobs** - Ensures consistency
3. **Monitor logs** - Scripts provide detailed progress information
4. **Test in development first** - Use `.dev.vars` before production
5. **Schedule during low-traffic hours** - Scripts can run for several minutes

---

## Support

For issues or questions:
- Check the error logs for specific error messages
- Verify environment variables are set correctly
- Ensure database migrations are up to date
- Review the ADR at `adrs/database-tcg-data.md` for design decisions

