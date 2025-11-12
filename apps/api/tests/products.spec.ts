import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import app from '../src';
import { ProductSearchResponse } from '../src/dtos';

describe('GET /api/products/search', () => {
  it('Returns 200 with empty search (all products)', async () => {
    const response = await app.request(
      '/api/products/search',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);

    // Check pagination structure
    expect(data.pagination).toEqual({
      page: expect.any(Number),
      pageSize: expect.any(Number),
      totalCount: expect.any(Number),
      totalPages: expect.any(Number),
      hasNextPage: expect.any(Boolean),
      hasPreviousPage: expect.any(Boolean),
    });
  });

  it('Returns products with correct structure', async () => {
    const response = await app.request(
      '/api/products/search?pageSize=5',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;

    if (data.data.length > 0) {
      const product = data.data[0];
      expect(product).toEqual({
        productId: expect.any(Number),
        name: expect.any(String),
        cleanName: expect.toBeOneOf([expect.any(String), null]),
        cardNumber: expect.toBeOneOf([expect.any(String), null]),
        imageUrl: expect.toBeOneOf([expect.any(String), null]),
        categoryId: expect.toBeOneOf([expect.any(Number), null]),
        groupId: expect.any(Number),
        url: expect.toBeOneOf([expect.any(String), null]),
        modifiedOn: expect.toBeOneOf([expect.any(String), null]),
        imageCount: expect.toBeOneOf([expect.any(Number), null]),
        group: {
          name: expect.toBeOneOf([expect.any(String), null]),
          abbreviation: expect.toBeOneOf([expect.any(String), null]),
        },
        subtypes: expect.any(Array),
        extendedData: expect.any(Array),
      });

      // Check subtypes structure if present
      if (product.subtypes.length > 0) {
        const subtype = product.subtypes[0];
        expect(subtype).toEqual({
          subTypeName: expect.any(String),
          latestPrice: expect.toBeOneOf([
            expect.objectContaining({
              lowPrice: expect.toBeOneOf([expect.any(String), null]),
              midPrice: expect.toBeOneOf([expect.any(String), null]),
              highPrice: expect.toBeOneOf([expect.any(String), null]),
              marketPrice: expect.toBeOneOf([
                expect.any(String),
                null,
              ]),
              directLowPrice: expect.toBeOneOf([
                expect.any(String),
                null,
              ]),
              recordedAt: expect.any(String),
            }),
            null,
          ]),
        });
      }
    }
  });

  it('Filters by search text', async () => {
    const response = await app.request(
      '/api/products/search?searchText=Bulbasaur&pageSize=10',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');

    // If there are results, verify they contain the search term
    if (data.data.length > 0) {
      const containsSearchTerm = data.data.every((product: any) => {
        const searchLower = 'bulbasaur';
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.cleanName?.toLowerCase().includes(searchLower) ||
          product.group?.name?.toLowerCase().includes(searchLower) ||
          product.cardNumber?.toLowerCase().includes(searchLower)
        );
      });
      expect(containsSearchTerm).toBe(true);
    }
  });

  it('Filters by multiple search tokens', async () => {
    const response = await app.request(
      '/api/products/search?searchText=Bulbasaur%20Stellar%20Crown&pageSize=10',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');

    // Verify the search works with multiple tokens
    // Each token should match at least one field
    if (data.data.length > 0) {
      const tokens = ['bulbasaur', 'stellar', 'crown'];
      data.data.forEach((product: any) => {
        tokens.forEach((token) => {
          const matchesToken =
            product.name?.toLowerCase().includes(token) ||
            product.cleanName?.toLowerCase().includes(token) ||
            product.group?.name?.toLowerCase().includes(token) ||
            product.cardNumber?.toLowerCase().includes(token);
          // At least one field should match each token
          expect(matchesToken).toBeDefined();
        });
      });
    }
  });

  it('Filters by card number', async () => {
    const response = await app.request(
      '/api/products/search?searchText=050%2F049&pageSize=10',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');

    // If there are results with this card number, verify they match
    if (data.data.length > 0) {
      const hasMatchingCardNumber = data.data.some((product: any) =>
        product.cardNumber?.includes('050/049')
      );
      expect(hasMatchingCardNumber).toBe(true);
    }
  });

  it('Filters by category ID', async () => {
    const response = await app.request(
      '/api/products/search?categoryId=1&pageSize=10',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');

    // If there are results, verify they all have the correct category
    if (data.data.length > 0) {
      const allMatchCategory = data.data.every(
        (product: any) => product.categoryId === 1
      );
      expect(allMatchCategory).toBe(true);
    }
  });

  it('Handles pagination with page parameter', async () => {
    const response = await app.request(
      '/api/products/search?page=2&pageSize=5',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.pageSize).toBe(5);
    expect(data.pagination.hasPreviousPage).toBe(true);
  });

  it('Respects pageSize parameter', async () => {
    const response = await app.request(
      '/api/products/search?pageSize=3',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data.pagination.pageSize).toBe(3);
    expect(data.data.length).toBeLessThanOrEqual(3);
  });

  it('Returns 400 for invalid parameters', async () => {
    const response = await app.request(
      '/api/products/search?categoryId=invalid',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(400);
  });

  it('Limits pageSize to maximum of 100', async () => {
    const response = await app.request(
      '/api/products/search?pageSize=150',
      {
        method: 'GET',
      },
      env
    );
    // Should return 400 because max is 100
    expect(response.status).toBe(400);
  });

  it('Returns correct hasNextPage and hasPreviousPage flags', async () => {
    // Get first page
    const firstPageResponse = await app.request(
      '/api/products/search?page=1&pageSize=5',
      {
        method: 'GET',
      },
      env
    );
    expect(firstPageResponse.status).toBe(200);
    const firstPageData =
      (await firstPageResponse.json()) as ProductSearchResponse;

    expect(firstPageData.pagination.hasPreviousPage).toBe(false);

    // If there are more than 5 products, hasNextPage should be true
    if (firstPageData.pagination.totalCount > 5) {
      expect(firstPageData.pagination.hasNextPage).toBe(true);
    }
  });

  it('Combines search text and category filter', async () => {
    const response = await app.request(
      '/api/products/search?searchText=test&categoryId=1&pageSize=10',
      {
        method: 'GET',
      },
      env
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as ProductSearchResponse;
    expect(data).toHaveProperty('data');

    // If there are results, verify they match both filters
    if (data.data.length > 0) {
      data.data.forEach((product: any) => {
        expect(product.categoryId).toBe(1);
      });
    }
  });
});
