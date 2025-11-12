import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../lib/api';

interface UseProductPricesParams {
  productIds: number[];
  enabled?: boolean;
}

/**
 * Hook to fetch prices for specific products
 * Used for lazy loading prices after initial product search
 */
export function useProductPrices({
  productIds,
  enabled = true,
}: UseProductPricesParams) {
  // Only enable query if there are product IDs and enabled flag is true
  const shouldFetch = enabled && productIds.length > 0;

  return useQuery({
    queryKey: ['products', 'prices', productIds.sort()],
    queryFn: () => productsApi.getPrices(productIds),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes (longer than search results)
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
}

