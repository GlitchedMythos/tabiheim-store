import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../lib/api';

interface UseProductSearchParams {
  searchText?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to search products with filters and pagination
 * Only fetches when there's a search text or category filter
 */
export function useProductSearch({
  searchText,
  categoryId,
  page = 1,
  pageSize = 20,
}: UseProductSearchParams) {
  // Only enable query if there's a search text or category filter
  const shouldFetch = Boolean(searchText?.trim() || categoryId);

  return useQuery({
    queryKey: ['products', 'search', { searchText, categoryId, page, pageSize }],
    queryFn: () =>
      productsApi.search({
        searchText,
        categoryId,
        page,
        pageSize,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000, // 30 seconds
  });
}

