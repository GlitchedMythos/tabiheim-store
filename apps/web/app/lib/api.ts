import type { ProductSearchResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      errorText || 'An error occurred',
      response.status,
      response.statusText
    );
  }

  return response.json();
}

/**
 * API client for categories
 */
export const categoriesApi = {
  /**
   * Fetch all categories
   */
  getAll: async () => {
    return apiFetch<{
      data: Array<{
        categoryId: number;
        name: string;
        displayName: string | null;
        modifiedOn: Date | null;
      }>;
    }>('/api/categories');
  },
};

/**
 * API client for products
 */
export const productsApi = {
  /**
   * Search products with filters and pagination
   */
  search: async (params: {
    searchText?: string;
    categoryId?: number;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.searchText) {
      searchParams.append('searchText', params.searchText);
    }
    if (params.categoryId !== undefined) {
      searchParams.append('categoryId', params.categoryId.toString());
    }
    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      searchParams.append('pageSize', params.pageSize.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/products/search${queryString ? `?${queryString}` : ''}`;

    return apiFetch<ProductSearchResponse>(endpoint);
  },
};

