import {
  Badge,
  Group,
  Image,
  Modal,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useProductDetail } from '../hooks/useProductDetail';
import { useProductPriceTimeline } from '../hooks/useProductPriceTimeline';

interface ProductDetailsModalProps {
  productId: number | null;
  opened: boolean;
  onClose: () => void;
}

// Colors for different subtypes
const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#a4de6c',
  '#d0ed57',
  '#83a6ed',
  '#8dd1e1',
];

export function ProductDetailsModal({
  productId,
  opened,
  onClose,
}: ProductDetailsModalProps) {
  // Set default date range to 7 days ago (as string for Mantine 8)
  const [startDateString, setStartDateString] = useState<
    string | null
  >(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });

  // Convert string date to Date object for API
  const startDate = startDateString
    ? new Date(startDateString)
    : null;

  // Fetch product details
  const { data: product, isLoading: productLoading } =
    useProductDetail({
      productId,
      enabled: opened && productId !== null,
    });

  // Fetch price timeline
  const { data: priceTimeline, isLoading: pricesLoading } =
    useProductPriceTimeline({
      productId,
      startDate,
      interval: '1 day',
      enabled: opened && productId !== null && startDate !== null,
    });

  // Transform timeline data for Recharts
  const chartData =
    (priceTimeline?.subtypes.length ?? 0) > 0 && startDate
      ? (() => {
          // Generate all dates from startDate to today
          const allDates = new Set<string>();
          const currentDate = new Date(startDate);
          const endDate = new Date();

          while (currentDate <= endDate) {
            allDates.add(currentDate.toLocaleDateString());
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Also include any dates from the actual data
          priceTimeline?.subtypes.forEach((subtype) => {
            subtype.timeline.forEach((point) => {
              allDates.add(
                new Date(point.bucket).toLocaleDateString()
              );
            });
          });

          // Create a map of date -> {subtype -> price}
          const dataByDate = new Map<
            string,
            Record<string, number | null>
          >();
          allDates.forEach((date) => {
            dataByDate.set(date, {});
          });

          // Fill in the data
          priceTimeline?.subtypes.forEach((subtype) => {
            subtype.timeline.forEach((point) => {
              const date = new Date(
                point.bucket
              ).toLocaleDateString();
              const data = dataByDate.get(date);
              if (data) {
                data[subtype.subTypeName] = point.avgMarketPrice
                  ? parseFloat(point.avgMarketPrice)
                  : null;
              }
            });
          });

          // Convert to array format for Recharts
          return Array.from(dataByDate.entries())
            .map(([date, prices]) => ({
              date,
              ...prices,
            }))
            .sort(
              (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
            );
        })()
      : [];

  // Find rarity in extended data
  const rarity = product?.extendedData?.find(
    (data) => data.name.toLowerCase() === 'rarity'
  );

  // Helper to format price
  const formatPrice = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  // Calculate Y-axis domain with padding to center the chart
  const calculateYAxisDomain = (): [number, number] => {
    if (chartData.length === 0) return [0, 100];

    // Get all price values from chart data
    const allPrices: number[] = [];
    chartData.forEach((dataPoint) => {
      Object.entries(dataPoint).forEach(([key, value]) => {
        if (key !== 'date' && typeof value === 'number') {
          allPrices.push(value);
        }
      });
    });

    if (allPrices.length === 0) return [0, 100];

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Add 15% padding above and below to center the line
    const range = maxPrice - minPrice;
    const padding = Math.max(range * 0.15, 0.5); // Minimum $0.50 padding

    // Round to 2 decimal places for clean axis labels
    const min = Math.max(0, Math.floor((minPrice - padding) * 100) / 100);
    const max = Math.ceil((maxPrice + padding) * 100) / 100;

    return [min, max];
  };

  const yAxisDomain = calculateYAxisDomain();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        productLoading
          ? 'Loading...'
          : product?.name || 'Product Details'
      }
      size="xl"
      padding="lg"
      // withinPortal={false}
    >
      <Stack gap="lg">
        {/* Product Details Section */}
        {productLoading ? (
          <Stack gap="md">
            <Skeleton height={200} />
            <Skeleton height={30} />
            <Skeleton height={20} />
          </Stack>
        ) : product ? (
          <>
            <Group align="flex-start" gap="lg" wrap="nowrap">
              {/* Product Image */}
              <Image
                src={product.imageUrl}
                height={250}
                alt={product.cleanName || product.name}
                fit="contain"
                fallbackSrc="https://placehold.co/240x240?text=No+Image"
                style={{ aspectRatio: '5 / 7' }}
                w="auto"
              />

              {/* Product Info */}
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={3}>{product.name}</Title>

                {/* Category */}
                {product.category && (
                  <Text size="sm" c="dimmed">
                    <strong>Category:</strong>{' '}
                    {product.category.displayName ||
                      product.category.name}
                  </Text>
                )}

                {/* Group */}
                {product.group && (
                  <Text size="sm" c="dimmed">
                    <strong>Set:</strong> {product.group.name}
                    {product.group.abbreviation &&
                      ` (${product.group.abbreviation})`}
                  </Text>
                )}

                {/* Card Number and Rarity */}
                <Group gap="xs">
                  {rarity?.value && (
                    <Badge color="grape" variant="light">
                      {rarity.value}
                    </Badge>
                  )}
                  {product.cardNumber && (
                    <Badge color="blue" variant="light">
                      #{product.cardNumber}
                    </Badge>
                  )}
                </Group>

                {/* Subtypes with latest prices */}
                {product.subtypes && product.subtypes.length > 0 && (
                  <Stack gap="xs" mt="sm">
                    <Text size="sm" fw={600}>
                      Current Prices:
                    </Text>
                    {product.subtypes.map((subtype) => (
                      <Group key={subtype.subtypeId} gap="xs">
                        <Badge
                          color="green"
                          variant="light"
                          size="md"
                        >
                          {subtype.subTypeName}:{' '}
                          {subtype.latestPrice?.marketPrice
                            ? formatPrice(
                                parseFloat(
                                  subtype.latestPrice.marketPrice
                                )
                              )
                            : 'N/A'}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Group>

            {/* Price History Section */}
            <Stack gap="md" mt="lg">
              <Title order={4}>Price History</Title>

              {/* Date Picker */}
              <DatePickerInput
                label="Start Date"
                description="Select how far back to view pricing data"
                value={startDateString}
                onChange={setStartDateString}
                maxDate={new Date().toISOString().split('T')[0]}
                clearable={false}
              />

              {/* Chart */}
              {pricesLoading ? (
                <Skeleton height={400} />
              ) : chartData.length > 0 &&
                priceTimeline?.subtypes &&
                priceTimeline.subtypes.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      label={{
                        value: 'Date',
                        position: 'insideBottom',
                        offset: -5,
                      }}
                    />
                    <YAxis
                      domain={yAxisDomain}
                      label={{
                        value: 'Price ($)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        formatPrice(value)
                      }
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    {priceTimeline.subtypes.map((subtype, index) => (
                      <Line
                        key={subtype.subtypeId}
                        type="monotone"
                        dataKey={subtype.subTypeName}
                        stroke={
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No price history available for the selected date
                  range.
                </Text>
              )}
            </Stack>
          </>
        ) : (
          <Text size="sm" c="dimmed" ta="center">
            Product not found.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
