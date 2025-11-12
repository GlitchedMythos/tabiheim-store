import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from '../db/schema';

export const ZUserInsert = createInsertSchema(schema.user, {
  email: () => z.email(),
}).pick({
  name: true,
  email: true,
});

export const ZUserSelect = createSelectSchema(schema.user, {
  id: () => z.uuid(),
  email: () => z.email(),
});

export const ZUserByIDParams = z.object({
  id: z.uuid(),
});

// Product Search Schemas
export const ZProductSearchQuery = z.object({
  searchText: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ProductSearchQuery = z.infer<typeof ZProductSearchQuery>;

export const ZProductSearchResponse = z.object({
  data: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      cleanName: z.string().nullable(),
      cardNumber: z.string().nullable(),
      imageUrl: z.string().nullable(),
      categoryId: z.number().nullable(),
      groupId: z.number(),
      url: z.string().nullable(),
      modifiedOn: z.date().nullable(),
      imageCount: z.number().nullable(),
      group: z.object({
        name: z.string().nullable(),
        abbreviation: z.string().nullable(),
      }),
      subtypes: z.array(
        z.object({
          subTypeName: z.string(),
          latestPrice: z
            .object({
              lowPrice: z.string().nullable(),
              midPrice: z.string().nullable(),
              highPrice: z.string().nullable(),
              marketPrice: z.string().nullable(),
              directLowPrice: z.string().nullable(),
              recordedAt: z.date(),
            })
            .nullable(),
        })
      ),
      extendedData: z.array(
        z.object({
          name: z.string(),
          displayName: z.string().nullable(),
          value: z.string().nullable(),
        })
      ),
    })
  ),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type ProductSearchResponse = z.infer<
  typeof ZProductSearchResponse
>;

// Fast Product Search Schemas (without prices/subtypes)
export const ZProductSearchResponseFast = z.object({
  data: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      cleanName: z.string().nullable(),
      cardNumber: z.string().nullable(),
      imageUrl: z.string().nullable(),
      categoryId: z.number().nullable(),
      groupId: z.number(),
      url: z.string().nullable(),
      modifiedOn: z.date().nullable(),
      imageCount: z.number().nullable(),
      group: z.object({
        name: z.string().nullable(),
        abbreviation: z.string().nullable(),
      }),
      extendedData: z.array(
        z.object({
          name: z.string(),
          displayName: z.string().nullable(),
          value: z.string().nullable(),
        })
      ),
    })
  ),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type ProductSearchResponseFast = z.infer<
  typeof ZProductSearchResponseFast
>;

// Product Prices Schemas
export const ZProductPricesQuery = z.object({
  productIds: z
    .string()
    .transform((val) => val.split(',').map((id) => parseInt(id.trim(), 10)))
    .pipe(z.array(z.number().int().positive()).min(1).max(100)),
});

export type ProductPricesQuery = z.infer<typeof ZProductPricesQuery>;

// Price data schema (reusable)
const ZPriceData = z.object({
  lowPrice: z.string().nullable(),
  midPrice: z.string().nullable(),
  highPrice: z.string().nullable(),
  marketPrice: z.string().nullable(),
  directLowPrice: z.string().nullable(),
  recordedAt: z.date(),
});

export const ZProductPricesResponse = z.object({
  data: z.record(
    z.string(), // productId as string key
    z.array(
      z.object({
        subtypeId: z.number(),
        subTypeName: z.string(),
        latestPrice: ZPriceData.nullable(),
      })
    )
  ),
});

export type ProductPricesResponse = z.infer<typeof ZProductPricesResponse>;

// Product Detail Schemas
export const ZProductIdParams = z.object({
  productId: z.coerce.number().int().positive(),
});

export type ProductIdParams = z.infer<typeof ZProductIdParams>;

export const ZProductDetailResponse = z.object({
  productId: z.number(),
  name: z.string(),
  cleanName: z.string().nullable(),
  cardNumber: z.string().nullable(),
  imageUrl: z.string().nullable(),
  categoryId: z.number().nullable(),
  groupId: z.number(),
  url: z.string().nullable(),
  modifiedOn: z.date().nullable(),
  imageCount: z.number().nullable(),
  group: z.object({
    groupId: z.number(),
    name: z.string(),
    abbreviation: z.string().nullable(),
    isSupplemental: z.boolean().nullable(),
    publishedOn: z.date().nullable(),
    modifiedOn: z.date().nullable(),
    categoryId: z.number().nullable(),
  }).nullable(),
  category: z.object({
    categoryId: z.number(),
    name: z.string(),
    displayName: z.string().nullable(),
    modifiedOn: z.date().nullable(),
  }).nullable(),
  subtypes: z.array(
    z.object({
      subtypeId: z.number(),
      subTypeName: z.string(),
      latestPrice: z.object({
        lowPrice: z.string().nullable(),
        midPrice: z.string().nullable(),
        highPrice: z.string().nullable(),
        marketPrice: z.string().nullable(),
        directLowPrice: z.string().nullable(),
        recordedAt: z.date(),
      }).nullable(),
    })
  ),
  extendedData: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().nullable(),
      value: z.string().nullable(),
    })
  ),
});

export type ProductDetailResponse = z.infer<typeof ZProductDetailResponse>;

// Product Price Timeline Schemas
export const ZProductPriceTimelineParams = z.object({
  productId: z.coerce.number().int().positive(),
});

export type ProductPriceTimelineParams = z.infer<
  typeof ZProductPriceTimelineParams
>;

export const ZProductPriceTimelineQuery = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  interval: z
    .enum(['1 hour', '6 hours', '12 hours', '1 day', '1 week', '1 month'])
    .default('1 day')
    .optional(),
});

export type ProductPriceTimelineQuery = z.infer<
  typeof ZProductPriceTimelineQuery
>;

export const ZProductPriceTimelineResponse = z.object({
  productId: z.number(),
  subtypes: z.array(
    z.object({
      subtypeId: z.number(),
      subTypeName: z.string(),
      timeline: z.array(
        z.object({
          bucket: z.date(),
          avgLowPrice: z.string().nullable(),
          avgMidPrice: z.string().nullable(),
          avgHighPrice: z.string().nullable(),
          avgMarketPrice: z.string().nullable(),
          avgDirectLowPrice: z.string().nullable(),
          minLowPrice: z.string().nullable(),
          maxHighPrice: z.string().nullable(),
          dataPoints: z.number(),
        })
      ),
    })
  ),
});

export type ProductPriceTimelineResponse = z.infer<
  typeof ZProductPriceTimelineResponse
>;
