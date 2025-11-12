import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import {
  extendedData,
  product,
  productCategory,
  productGroup,
  productSubtype,
} from '../db/schema';
import {
  ZProductIdParams,
  ZProductPricesQuery,
  ZProductPriceTimelineParams,
  ZProductPriceTimelineQuery,
  ZProductSearchQuery,
} from '../dtos';
import { requireAuth } from '../middleware/auth';
import type { DrizzleDB } from '../middleware/dbProvider';
import { zodValidator } from '../middleware/validator';

type Variables = {
  db: DrizzleDB;
};

const productsRouter = new Hono<{ Variables: Variables }>();

productsRouter.get(
  '/search',
  requireAuth,
  zodValidator('query', ZProductSearchQuery),
  async (c) => {
    const db = c.var.db;
    const { searchText, categoryId, page, pageSize } =
      c.req.valid('query');

    // Build search conditions
    const searchConditions = [];

    // Add category filter if provided
    if (categoryId !== undefined) {
      searchConditions.push(eq(product.categoryId, categoryId));
    }

    // Add multi-field search if search text provided
    if (searchText && searchText.trim()) {
      // Split search text into tokens for better matching
      const tokens = searchText.trim().split(/\s+/);

      // Each token must match at least one field (AND logic across tokens)
      const tokenConditions = tokens.map((token) => {
        const pattern = `%${token}%`;
        return or(
          ilike(product.name, pattern),
          ilike(product.cleanName, pattern),
          ilike(productGroup.name, pattern),
          ilike(product.cardNumber, pattern)
        );
      });

      // All tokens must match (AND logic)
      if (tokenConditions.length > 0) {
        searchConditions.push(and(...tokenConditions));
      }
    }

    // Combine all conditions
    const whereClause =
      searchConditions.length > 0
        ? and(...searchConditions)
        : undefined;

    // Execute queries in parallel for better performance
    const [results, countResult] = await Promise.all([
      // Main data query with joins
      db
        .select({
          productId: product.productId,
          name: product.name,
          cleanName: product.cleanName,
          cardNumber: product.cardNumber,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          groupId: product.groupId,
          url: product.url,
          modifiedOn: product.modifiedOn,
          imageCount: product.imageCount,
          groupName: productGroup.name,
          groupAbbreviation: productGroup.abbreviation,
        })
        .from(product)
        .leftJoin(
          productGroup,
          eq(product.groupId, productGroup.groupId)
        )
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(product.productId),

      // Count query
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(product)
        .leftJoin(
          productGroup,
          eq(product.groupId, productGroup.groupId)
        )
        .where(whereClause),
    ]);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch extended data for all products in the result set
    const productIds = results.map(
      (r: (typeof results)[number]) => r.productId
    );
    const extendedDataResults =
      productIds.length > 0
        ? await db
            .select({
              productId: extendedData.productId,
              name: extendedData.name,
              displayName: extendedData.displayName,
              value: extendedData.value,
            })
            .from(extendedData)
            .where(inArray(extendedData.productId, productIds))
        : [];

    // Group extended data by product ID
    const extendedDataByProduct = extendedDataResults.reduce(
      (
        acc: Record<
          number,
          Array<{
            name: string;
            displayName: string | null;
            value: string | null;
          }>
        >,
        ed: (typeof extendedDataResults)[number]
      ) => {
        if (!acc[ed.productId]) {
          acc[ed.productId] = [];
        }
        acc[ed.productId].push({
          name: ed.name,
          displayName: ed.displayName,
          value: ed.value,
        });
        return acc;
      },
      {} as Record<
        number,
        Array<{
          name: string;
          displayName: string | null;
          value: string | null;
        }>
      >
    );

    // Format response (without subtypes/prices for better performance)
    const data = results.map((row: (typeof results)[number]) => ({
      productId: row.productId,
      name: row.name,
      cleanName: row.cleanName,
      cardNumber: row.cardNumber,
      imageUrl: row.imageUrl,
      categoryId: row.categoryId,
      groupId: row.groupId,
      url: row.url,
      modifiedOn: row.modifiedOn,
      imageCount: row.imageCount,
      group: {
        name: row.groupName,
        abbreviation: row.groupAbbreviation,
      },
      extendedData: extendedDataByProduct[row.productId] || [],
    }));

    return c.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }
);

// Get prices for specific products
productsRouter.get(
  '/prices',
  requireAuth,
  zodValidator('query', ZProductPricesQuery),
  async (c) => {
    const db = c.var.db;
    const { productIds } = c.req.valid('query');

    // Fetch subtypes for the requested products
    const subtypesData = await db
      .select({
        id: productSubtype.id,
        productId: productSubtype.productId,
        subTypeName: productSubtype.subTypeName,
      })
      .from(productSubtype)
      .where(inArray(productSubtype.productId, productIds));

    if (subtypesData.length === 0) {
      // No subtypes found for these products
      return c.json({
        data: productIds.reduce((acc, id) => {
          acc[id.toString()] = [];
          return acc;
        }, {} as Record<string, never[]>),
      });
    }

    const subtypeIds = subtypesData.map((st) => st.id);

    // Query the latest prices using DISTINCT ON for optimal performance
    // This replaces fetching all prices and filtering in JavaScript
    const pricesResult = await db.execute<{
      productSubtypeId: number;
      lowPrice: string | null;
      midPrice: string | null;
      highPrice: string | null;
      marketPrice: string | null;
      directLowPrice: string | null;
      recordedAt: Date;
    }>(sql`
      SELECT DISTINCT ON (product_subtype_id)
        product_subtype_id as "productSubtypeId",
        low_price as "lowPrice",
        mid_price as "midPrice",
        high_price as "highPrice",
        market_price as "marketPrice",
        direct_low_price as "directLowPrice",
        recorded_at as "recordedAt"
      FROM product_price
      WHERE product_subtype_id IN (${sql.join(
        subtypeIds.map((id) => sql`${id}`),
        sql`, `
      )})
      ORDER BY product_subtype_id, recorded_at DESC
    `);

    // Map prices by subtype ID for quick lookup
    const pricesBySubtype = pricesResult.rows.reduce(
      (acc, price) => {
        acc[price.productSubtypeId] = {
          lowPrice: price.lowPrice,
          midPrice: price.midPrice,
          highPrice: price.highPrice,
          marketPrice: price.marketPrice,
          directLowPrice: price.directLowPrice,
          recordedAt: price.recordedAt,
        };
        return acc;
      },
      {} as Record<
        number,
        {
          lowPrice: string | null;
          midPrice: string | null;
          highPrice: string | null;
          marketPrice: string | null;
          directLowPrice: string | null;
          recordedAt: Date;
        }
      >
    );

    // Group by product ID
    const pricesByProduct = subtypesData.reduce(
      (acc, subtype) => {
        const productIdStr = subtype.productId.toString();
        if (!acc[productIdStr]) {
          acc[productIdStr] = [];
        }
        acc[productIdStr].push({
          subtypeId: subtype.id,
          subTypeName: subtype.subTypeName,
          latestPrice: pricesBySubtype[subtype.id] || null,
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{
          subtypeId: number;
          subTypeName: string;
          latestPrice: {
            lowPrice: string | null;
            midPrice: string | null;
            highPrice: string | null;
            marketPrice: string | null;
            directLowPrice: string | null;
            recordedAt: Date;
          } | null;
        }>
      >
    );

    // Ensure all requested product IDs are in the response (even if no prices)
    productIds.forEach((id) => {
      const idStr = id.toString();
      if (!pricesByProduct[idStr]) {
        pricesByProduct[idStr] = [];
      }
    });

    return c.json({
      data: pricesByProduct,
    });
  }
);

// Get price timeline for a product
productsRouter.get(
  '/:productId/prices/timeline',
  requireAuth,
  zodValidator('param', ZProductPriceTimelineParams),
  zodValidator('query', ZProductPriceTimelineQuery),
  async (c) => {
    const db = c.var.db;
    const { productId } = c.req.valid('param');
    const { startDate, endDate, interval } = c.req.valid('query');

    // Set endDate to now if not provided
    const effectiveEndDate = endDate || new Date();

    // Validate that startDate is before endDate
    if (startDate >= effectiveEndDate) {
      return c.json(
        { error: 'startDate must be before endDate' },
        400
      );
    }

    // First, verify the product exists
    const productExists = await db
      .select({ productId: product.productId })
      .from(product)
      .where(eq(product.productId, productId))
      .limit(1);

    if (productExists.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Fetch all subtypes for this product
    const subtypes = await db
      .select({
        id: productSubtype.id,
        subTypeName: productSubtype.subTypeName,
      })
      .from(productSubtype)
      .where(eq(productSubtype.productId, productId));

    if (subtypes.length === 0) {
      // Product has no subtypes, return empty timeline
      return c.json({
        productId,
        subtypes: [],
      });
    }

    const subtypeIds = subtypes.map((st) => st.id);

    // Use TimescaleDB's time_bucket to aggregate prices by time interval
    // This efficiently queries time-series data using the hypertable
    const timelineData = await db.execute<{
      productSubtypeId: number;
      bucket: Date;
      avgLowPrice: string | null;
      avgMidPrice: string | null;
      avgHighPrice: string | null;
      avgMarketPrice: string | null;
      avgDirectLowPrice: string | null;
      minLowPrice: string | null;
      maxHighPrice: string | null;
      dataPoints: number;
    }>(sql`
      SELECT
        product_subtype_id as "productSubtypeId",
        time_bucket(${
          interval || '1 day'
        }::interval, recorded_at) AS bucket,
        AVG(low_price)::numeric(10, 2) AS "avgLowPrice",
        AVG(mid_price)::numeric(10, 2) AS "avgMidPrice",
        AVG(high_price)::numeric(10, 2) AS "avgHighPrice",
        AVG(market_price)::numeric(10, 2) AS "avgMarketPrice",
        AVG(direct_low_price)::numeric(10, 2) AS "avgDirectLowPrice",
        MIN(low_price)::numeric(10, 2) AS "minLowPrice",
        MAX(high_price)::numeric(10, 2) AS "maxHighPrice",
        COUNT(*)::integer AS "dataPoints"
      FROM product_price
      WHERE product_subtype_id IN (${sql.join(
        subtypeIds.map((id) => sql`${id}`),
        sql`, `
      )})
        AND recorded_at >= ${startDate.toISOString()}::timestamptz
        AND recorded_at <= ${effectiveEndDate.toISOString()}::timestamptz
      GROUP BY product_subtype_id, bucket
      ORDER BY product_subtype_id, bucket ASC
    `);

    // Group timeline data by subtype
    const timelineBySubtype = timelineData.rows.reduce(
      (acc, row) => {
        if (!acc[row.productSubtypeId]) {
          acc[row.productSubtypeId] = [];
        }
        acc[row.productSubtypeId].push({
          bucket: row.bucket,
          avgLowPrice: row.avgLowPrice,
          avgMidPrice: row.avgMidPrice,
          avgHighPrice: row.avgHighPrice,
          avgMarketPrice: row.avgMarketPrice,
          avgDirectLowPrice: row.avgDirectLowPrice,
          minLowPrice: row.minLowPrice,
          maxHighPrice: row.maxHighPrice,
          dataPoints: row.dataPoints,
        });
        return acc;
      },
      {} as Record<
        number,
        Array<{
          bucket: Date;
          avgLowPrice: string | null;
          avgMidPrice: string | null;
          avgHighPrice: string | null;
          avgMarketPrice: string | null;
          avgDirectLowPrice: string | null;
          minLowPrice: string | null;
          maxHighPrice: string | null;
          dataPoints: number;
        }>
      >
    );

    // Build response with all subtypes (even if they have no price data)
    const response = {
      productId,
      subtypes: subtypes.map((subtype) => ({
        subtypeId: subtype.id,
        subTypeName: subtype.subTypeName,
        timeline: timelineBySubtype[subtype.id] || [],
      })),
    };

    return c.json(response);
  }
);

// Get single product with full details
productsRouter.get(
  '/:productId',
  requireAuth,
  zodValidator('param', ZProductIdParams),
  async (c) => {
    const db = c.var.db;
    const { productId } = c.req.valid('param');

    // Fetch product with group and category joins
    const productResult = await db
      .select({
        productId: product.productId,
        name: product.name,
        cleanName: product.cleanName,
        cardNumber: product.cardNumber,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        groupId: product.groupId,
        url: product.url,
        modifiedOn: product.modifiedOn,
        imageCount: product.imageCount,
        // Group fields
        groupGroupId: productGroup.groupId,
        groupName: productGroup.name,
        groupAbbreviation: productGroup.abbreviation,
        groupIsSupplemental: productGroup.isSupplemental,
        groupPublishedOn: productGroup.publishedOn,
        groupModifiedOn: productGroup.modifiedOn,
        groupCategoryId: productGroup.categoryId,
        // Category fields
        categoryCategoryId: productCategory.categoryId,
        categoryName: productCategory.name,
        categoryDisplayName: productCategory.displayName,
        categoryModifiedOn: productCategory.modifiedOn,
      })
      .from(product)
      .leftJoin(
        productGroup,
        eq(product.groupId, productGroup.groupId)
      )
      .leftJoin(
        productCategory,
        eq(product.categoryId, productCategory.categoryId)
      )
      .where(eq(product.productId, productId))
      .limit(1);

    // Return 404 if product not found
    if (productResult.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const productData = productResult[0];

    // Fetch subtypes and extended data in parallel
    const [subtypesData, extendedDataResults] = await Promise.all([
      db
        .select({
          id: productSubtype.id,
          subTypeName: productSubtype.subTypeName,
        })
        .from(productSubtype)
        .where(eq(productSubtype.productId, productId)),
      db
        .select({
          name: extendedData.name,
          displayName: extendedData.displayName,
          value: extendedData.value,
        })
        .from(extendedData)
        .where(eq(extendedData.productId, productId)),
    ]);

    // Fetch latest prices for subtypes if any exist
    let pricesBySubtype: Record<
      number,
      {
        lowPrice: string | null;
        midPrice: string | null;
        highPrice: string | null;
        marketPrice: string | null;
        directLowPrice: string | null;
        recordedAt: Date;
      }
    > = {};

    if (subtypesData.length > 0) {
      const subtypeIds = subtypesData.map((st) => st.id);
      const pricesResult = await db.execute<{
        productSubtypeId: number;
        lowPrice: string | null;
        midPrice: string | null;
        highPrice: string | null;
        marketPrice: string | null;
        directLowPrice: string | null;
        recordedAt: Date;
      }>(sql`
        SELECT DISTINCT ON (product_subtype_id)
          product_subtype_id as "productSubtypeId",
          low_price as "lowPrice",
          mid_price as "midPrice",
          high_price as "highPrice",
          market_price as "marketPrice",
          direct_low_price as "directLowPrice",
          recorded_at as "recordedAt"
        FROM product_price
        WHERE product_subtype_id IN (${sql.join(
          subtypeIds.map((id) => sql`${id}`),
          sql`, `
        )})
        ORDER BY product_subtype_id, recorded_at DESC
      `);

      pricesBySubtype = pricesResult.rows.reduce(
        (acc, price) => {
          acc[price.productSubtypeId] = {
            lowPrice: price.lowPrice,
            midPrice: price.midPrice,
            highPrice: price.highPrice,
            marketPrice: price.marketPrice,
            directLowPrice: price.directLowPrice,
            recordedAt: price.recordedAt,
          };
          return acc;
        },
        {} as Record<
          number,
          {
            lowPrice: string | null;
            midPrice: string | null;
            highPrice: string | null;
            marketPrice: string | null;
            directLowPrice: string | null;
            recordedAt: Date;
          }
        >
      );
    }

    // Format subtypes with prices
    const subtypes = subtypesData.map((subtype) => ({
      subtypeId: subtype.id,
      subTypeName: subtype.subTypeName,
      latestPrice: pricesBySubtype[subtype.id] || null,
    }));

    // Build response
    const response = {
      productId: productData.productId,
      name: productData.name,
      cleanName: productData.cleanName,
      cardNumber: productData.cardNumber,
      imageUrl: productData.imageUrl,
      categoryId: productData.categoryId,
      groupId: productData.groupId,
      url: productData.url,
      modifiedOn: productData.modifiedOn,
      imageCount: productData.imageCount,
      group: productData.groupGroupId
        ? {
            groupId: productData.groupGroupId,
            name: productData.groupName,
            abbreviation: productData.groupAbbreviation,
            isSupplemental: productData.groupIsSupplemental,
            publishedOn: productData.groupPublishedOn,
            modifiedOn: productData.groupModifiedOn,
            categoryId: productData.groupCategoryId,
          }
        : null,
      category: productData.categoryCategoryId
        ? {
            categoryId: productData.categoryCategoryId,
            name: productData.categoryName,
            displayName: productData.categoryDisplayName,
            modifiedOn: productData.categoryModifiedOn,
          }
        : null,
      subtypes,
      extendedData: extendedDataResults,
    };

    return c.json(response);
  }
);

export default productsRouter;
