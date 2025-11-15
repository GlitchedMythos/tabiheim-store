import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../lib/api';

interface UseProductSparklinesParams {
  productIds: number[];
  days?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch sparkline data for multiple products
 * Designed for lazy loading with intersection observer
 */
export function useProductSparklines({
  productIds,
  days = 14,
  enabled = true,
}: UseProductSparklinesParams) {
  const shouldFetch = enabled && productIds.length > 0;

  return useQuery({
    queryKey: ['products', 'sparklines', productIds.sort(), days],
    queryFn: () => productsApi.getSparklines(productIds, days),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
}

