Thinking about this as the databse schema

```mermaid
erDiagram
    CATEGORY ||--o{ CARD_GROUP : "contains"
    CARD_GROUP ||--o{ CARD : "contains"
    CARD ||--o| PRESALE_INFO : "has"
    CARD ||--o{ EXTENDED_DATA : "has"
    CARD ||--o{ CARD_SUBTYPE : "has"
    CARD_SUBTYPE ||--o{ PRICE : "has"

    CATEGORY {
      int categoryId PK
      string name
      string displayName
      datetime modifiedOn
    }

    CARD_GROUP {
      int groupId PK
      string name
      string abbreviation
      boolean isSupplemental
      datetime publishedOn
      datetime modifiedOn
      int categoryId
    }

    CARD {
      int productId PK
      string name
      string cleanName
      string imageUrl
      int categoryId
      int groupId FK
      string url
      datetime modifiedOn
      int imageCount
    }

    PRESALE_INFO {
      int productId PK,FK
      boolean isPresale
      datetime releasedOn
      string note
    }

    EXTENDED_DATA {
      int id PK
      int productId FK
      string name
      string displayName
      string value
    }

    CARD_SUBTYPE {
      int id PK
      int productId FK
      string subTypeName
      boolean isActive
      datetime firstSeenAt
      datetime lastSeenAt
    }

    PRICE {
      int id PK
      int cardSubtypeId FK
      timestamptz recordedAt
      decimal lowPrice
      decimal midPrice
      decimal highPrice
      decimal marketPrice
      decimal directLowPrice
    }
```

This is a simplified schema for the TCG data.

There are only 4 Categories from tcgcsv.com that we care about:

categoryId | name
3 | Pokemon
85 | Pokemon Japan
68 | One-Piece
71 | Lorcana

## Seeding Categories

A seed script has been created at `apps/api/scripts/seed-categories.ts` that:
1. Fetches the latest category data from the [tcgcsv.com API](https://tcgcsv.com/tcgplayer/categories)
2. Filters to only the 4 categories we support (IDs: 3, 85, 68, 71)
3. Inserts them into the database with accurate `name`, `displayName`, and `modifiedOn` fields

To run the script:

```bash
# Development environment
cd apps/api
pnpm run db:seed:categories

# Production environment
cd apps/api
pnpm run db:seed:categories:prod
```

The script uses `onConflictDoNothing()` so it's safe to run multiple times - it won't create duplicates.