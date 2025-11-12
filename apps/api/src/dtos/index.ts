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
      subtypes: z.array(z.string()),
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
