import { Hono } from 'hono';
import { productCategory } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import type { DrizzleDB } from '../middleware/dbProvider';

type Variables = {
  db: DrizzleDB;
};

const categoriesRouter = new Hono<{ Variables: Variables }>();

categoriesRouter.get('/', requireAuth, async (c) => {
  const db = c.var.db;

  const categories = await db
    .select({
      categoryId: productCategory.categoryId,
      name: productCategory.name,
      displayName: productCategory.displayName,
      modifiedOn: productCategory.modifiedOn,
    })
    .from(productCategory)
    .orderBy(productCategory.categoryId);

  return c.json({ data: categories });
});

export default categoriesRouter;

