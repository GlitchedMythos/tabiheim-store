import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { product, productGroup, productSubtype } from '../db/schema';
import { ZProductSearchQuery } from '../dtos';
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

    // Fetch subtypes for all products in the result set
    const productIds = results.map(
      (r: (typeof results)[number]) => r.productId
    );
    const subtypesData =
      productIds.length > 0
        ? await db
            .select({
              productId: productSubtype.productId,
              subTypeName: productSubtype.subTypeName,
            })
            .from(productSubtype)
            .where(inArray(productSubtype.productId, productIds))
        : [];

    // Group subtypes by product ID
    const subtypesByProduct = subtypesData.reduce(
      (
        acc: Record<number, string[]>,
        st: (typeof subtypesData)[number]
      ) => {
        if (!acc[st.productId]) {
          acc[st.productId] = [];
        }
        acc[st.productId].push(st.subTypeName);
        return acc;
      },
      {} as Record<number, string[]>
    );

    // Format response
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
      subtypes: subtypesByProduct[row.productId] || [],
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

export default productsRouter;
