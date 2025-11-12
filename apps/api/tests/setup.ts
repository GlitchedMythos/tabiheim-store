import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { createMiddleware } from "hono/factory";
import { afterAll, beforeAll, vi } from "vitest";
import { createTestBranch, deleteBranch } from "./helpers";

/**
 * Create a temporary test branch, and mock the database provider
 * middleware so that tests don't affect the primary database(s).
 */

const { id: testBranchId, uri: testBranchUri } = await createTestBranch();

beforeAll(async () => {
  vi.mock("../src/middleware/dbProvider.ts", () => {
    return {
      dbProvider: createMiddleware(async (c, next) => {
        const db = drizzle(neon(testBranchUri), {
          casing: "snake_case",
        });

        c.set("db", db);
        await next();
      }),
    };
  });

  vi.mock("../src/middleware/auth.ts", () => {
    return {
      requireAuth: createMiddleware(async (c, next) => {
        // Mock authenticated user for tests
        c.set("user", {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
        });
        c.set("session", {
          id: "test-session-id",
          userId: "test-user-id",
        });
        await next();
      }),
    };
  });
});

afterAll(async () => {
  deleteBranch(testBranchId);
});
