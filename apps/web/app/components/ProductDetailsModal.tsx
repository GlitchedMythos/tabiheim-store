import { LineChart } from '@mantine/charts';
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
import { useMemo, useState } from 'react';
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

  const chartData = useMemo(() => {
    if (!priceTimeline?.subtypes || priceTimeline.subtypes.length === 0 || startDate === null) {
      return [];
    }

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Transform data shape from:
    // { subtypes: [{ subTypeName, timeline: [{ bucket, avgMarketPrice }] }] }
    // To:
    // [{ date: string, [subtypeName]: number | null }]

    // Normalize start date and create date key for filtering
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    const startDateKey = formatLocalDate(start);

    // Create a map to group data points by date (using YYYY-MM-DD format)
    const dateMap = new Map<string, Record<string, number | string | null>>();

    // Iterate through each subtype and its timeline
    priceTimeline.subtypes.forEach((subtype) => {
      subtype.timeline.forEach((point) => {
        const date = new Date(point.bucket);
        const dateKey = formatLocalDate(date); // YYYY-MM-DD format in local timezone

        // Only include dates >= start date
        if (dateKey >= startDateKey) {
          // Initialize the date entry if it doesn't exist
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, { date: dateKey });
          }

          // Add the market price for this subtype
          const entry = dateMap.get(dateKey)!;
          if (point.avgMarketPrice) {
            entry[subtype.subTypeName] = parseFloat(point.avgMarketPrice);
          }
        }
      });
    });

    // Generate complete date range from startDate to now
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    // Fill in missing dates
    const currentDate = new Date(start);
    while (currentDate <= now) {
      const dateKey = formatLocalDate(currentDate); // YYYY-MM-DD format in local timezone

      // If this date doesn't have data, create an entry with just the date
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Convert map to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
  }, [priceTimeline, startDate]);

  // Generate series configuration from priceTimeline
  const chartSeries = useMemo(() => {
    if (!priceTimeline?.subtypes) {
      return [];
    }

    return priceTimeline.subtypes.map((subtype, index) => ({
      name: subtype.subTypeName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [priceTimeline]);

  // Find rarity in extended data
  const rarity = product?.extendedData?.find(
    (data) => data.name.toLowerCase() === 'rarity'
  );

  // Helper to format price
  const formatPrice = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

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
                <LineChart
                  h={400}
                  data={chartData}
                  dataKey="date"
                  series={chartSeries}
                  withLegend
                  withDots={false}
                  curveType="linear"
                  connectNulls
                  valueFormatter={(value) => formatPrice(value)}
                  xAxisProps={{
                    tickFormatter: (value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    },
                  }}
                  yAxisLabel="Price"
                  gridAxis="xy"
                  withTooltip
                  tooltipAnimationDuration={200}
                />
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
