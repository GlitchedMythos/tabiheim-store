import {
  Center,
  Container,
  Grid,
  Pagination,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useCategories } from '../hooks/useCategories';
import { useProductSearch } from '../hooks/useProductSearch';
import { categoriesApi } from '../lib/api';
import { getQueryClient } from '../lib/queryClient';

/**
 * Client loader to prefetch categories for the dropdown using React Query
 */
export async function clientLoader() {
  const queryClient = getQueryClient();

  // Prefetch categories using React Query - this will populate the cache
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });

  // We don't need to return anything since the data is in the cache
  return null;
}

export default function Products() {
  const [searchText, setSearchText] = useState('');
  // Default to 'All Categories' (empty string)
  const [categoryId, setCategoryId] = useState<string | null>('');
  const [page, setPage] = useState(1);

  // Debounce search text to avoid excessive API calls
  const [debouncedSearchText] = useDebouncedValue(searchText, 500);

  // Fetch categories - data is already prefetched in clientLoader
  const { data: categoriesData } = useCategories();

  // Fetch products based on search criteria
  const { data: productsData, isLoading: productsLoading } =
    useProductSearch({
      searchText: debouncedSearchText,
      categoryId:
        categoryId && categoryId !== ''
          ? Number(categoryId)
          : undefined,
      page,
      pageSize: 20,
    });

  // Prepare category options for Select
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categoriesData?.data.map((cat) => ({
      value: cat.categoryId.toString(),
      label: cat.displayName || cat.name,
    })) || []),
  ];

  // Reset page when search criteria changes
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value || null);
    setPage(1);
  };

  // Determine if we should show empty state
  const showEmptyState =
    !debouncedSearchText && !categoryId && !productsLoading;
  const showNoResults =
    !productsLoading &&
    productsData?.data.length === 0 &&
    (debouncedSearchText || categoryId);

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Title order={1}>Products</Title>

        {/* Search and Filter Section */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={searchText}
              onChange={(event) =>
                handleSearchChange(event.currentTarget.value)
              }
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Filter by category"
              data={categoryOptions}
              value={categoryId}
              onChange={handleCategoryChange}
              size="md"
              clearable
            />
          </Grid.Col>
        </Grid>

        {/* Empty State */}
        {showEmptyState && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">
                Start searching or select a category to view products
              </Text>
            </Stack>
          </Center>
        )}

        {/* Loading State */}
        {productsLoading && (
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing="lg"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height={400} radius="md" />
            ))}
          </SimpleGrid>
        )}

        {/* No Results */}
        {showNoResults && (
          <Center py="xl">
            <Text size="lg" c="dimmed">
              No products found. Try adjusting your search criteria.
            </Text>
          </Center>
        )}

        {/* Products Grid */}
        {!productsLoading &&
          productsData &&
          productsData.data.length > 0 && (
            <>
              <SimpleGrid
                cols={{ base: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                spacing="lg"
              >
                {productsData.data.map((product) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                  />
                ))}
              </SimpleGrid>

              {/* Pagination */}
              {productsData.pagination.totalPages > 1 && (
                <Stack align="center" gap="sm" mt="xl">
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={productsData.pagination.totalPages}
                    siblings={1}
                    boundaries={1}
                  />
                  <Text size="sm" c="dimmed">
                    Page {productsData.pagination.page} of{' '}
                    {productsData.pagination.totalPages} (
                    {productsData.pagination.totalCount} total
                    results)
                  </Text>
                </Stack>
              )}
            </>
          )}
      </Stack>
    </Container>
  );
}
