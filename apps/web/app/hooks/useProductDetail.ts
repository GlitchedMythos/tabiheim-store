import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../lib/api';

interface UseProductDetailParams {
  productId: number | null;
  enabled?: boolean;
}

/**
 * Hook to fetch full details for a single product
 */
export function useProductDetail({
  productId,
  enabled = true,
}: UseProductDetailParams) {
  // Only enable query if productId is provided and enabled flag is true
  const shouldFetch = enabled && productId !== null;

  return useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.getProduct(productId!),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
}

