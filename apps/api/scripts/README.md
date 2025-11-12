# TCG Data Seeding Scripts

This directory contains scripts for seeding and maintaining TCG (Trading Card Game) product and price data from the [tcgcsv.com API](https://tcgcsv.com).

## Overview

The seeding system consists of three main components:

1. **Product Seeding** - Fetches categories, groups, and products
2. **Price Seeding** - Fetches current prices for all products
3. **Nightly Sync** - Orchestrates both product and price seeding

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

## Reusable Functions

### `lib/price-seeding.ts`

This module contains reusable functions designed for both API and archival use:

#### `fetchLastUpdatedTimestamp(): Promise<Date>`
Fetches the authoritative timestamp from tcgcsv.com

#### `fetchPricesForGroup(categoryId: number, groupId: number): Promise<TCGCSVPriceData[]>`
Fetches prices for a specific group

#### `seedPrices(db: NeonHttpDatabase, recordedAt?: Date): Promise<number>`
Main seeding logic with optional timestamp parameter

**Archival data support**:
```typescript
import { seedPrices } from './lib/price-seeding';

// For API usage (uses current timestamp from API)
const timestamp = await fetchLastUpdatedTimestamp();
await seedPrices(db, timestamp);

// For archival imports (use historical date)
const historicalDate = new Date('2024-01-15T00:00:00Z');
await seedPrices(db, historicalDate);
```

This design enables future archival imports from 7zip files while reusing all the core logic.

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

### Archival Data Import
The system is designed to support importing historical price data from 7zip archives:

1. Extract 7zip file with date-stamped folders
2. Parse folder structure to get `categoryId`, `groupId`, and date
3. Read JSON files with same format as API
4. Call `seedPrices(db, historicalDate)` with extracted date

Example structure:
```
archive-2024-01-15.7z
  └── 2024-01-15/
      └── tcgplayer/
          └── 85/
              └── 23614/
                  └── prices.json  # Same format as API
```

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

