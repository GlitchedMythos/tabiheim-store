import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../lib/api';

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}

