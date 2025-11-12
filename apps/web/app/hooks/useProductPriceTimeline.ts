import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productsApi } from '../lib/api';

interface UseProductPriceTimelineParams {
  productId: number | null;
  startDate: Date | null;
  endDate?: Date;
  interval?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch price timeline for a product
 */
export function useProductPriceTimeline({
  productId,
  startDate,
  endDate,
  interval = '1 day',
  enabled = true,
}: UseProductPriceTimelineParams) {
  // Only enable query if productId and startDate are provided
  const shouldFetch =
    enabled && productId !== null && startDate !== null;

  // Memoize query key to prevent unnecessary refetches
  const queryKey = useMemo(() => {
    if (!productId || !startDate) return ['products', 'timeline', null];
    return [
      'products',
      'timeline',
      productId,
      startDate.toISOString(),
      endDate?.toISOString(),
      interval,
    ];
  }, [productId, startDate, endDate, interval]);

  return useQuery({
    queryKey,
    queryFn: () =>
      productsApi.getPriceTimeline(
        productId!,
        startDate!,
        endDate,
        interval
      ),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
}

