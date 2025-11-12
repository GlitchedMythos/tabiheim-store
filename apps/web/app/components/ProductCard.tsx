import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconExternalLink,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useProductPrices } from '../hooks/useProductPrices';
import type { Product, ProductMinimal } from '../lib/types';
import { ProductDetailsModal } from './ProductDetailsModal';

interface ProductCardProps {
  product: Product | ProductMinimal;
}

export function ProductCard({ product }: ProductCardProps) {
  // Modal state
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  // Lazy load prices for this product
  const { data: pricesData, isLoading: pricesLoading } =
    useProductPrices({
      productIds: [product.productId],
    });

  // Get subtypes from either the product (if already loaded) or the prices response
  const subtypes =
    'subtypes' in product && product.subtypes
      ? product.subtypes
      : pricesData?.data[product.productId.toString()] || [];

  // Find rarity in extended data
  const rarity = product.extendedData?.find(
    (data) => data.name.toLowerCase() === 'rarity'
  );

  // Helper to format price
  const formatPrice = (price: string | null): string => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group
        wrap="nowrap"
        justify="flex-start"
        align="flex-start"
        gap="sm"
      >
        <Image
          src={product.imageUrl}
          height={200}
          alt={product.cleanName || product.name}
          fit="contain"
          fallbackSrc="https://placehold.co/240x240?text=No+Image"
          style={{ aspectRatio: '5 / 7' }}
          w="auto"
        />
        <Stack gap="2" mt="md">
          {/* Product Name */}
          <Text fw={700} size="md" lineClamp={2}>
            {product.name}
          </Text>

          {/* Group Name */}
          {product.group.name && (
            <Text size="sm" c="dimmed">
              {product.group.name}
            </Text>
          )}

          {/* Card Number and Rarity */}
          <Group gap="xs">
            {rarity?.value && (
              <Badge color="grape" variant="light" size="sm">
                {rarity.value}
              </Badge>
            )}
            {product.cardNumber && (
              <Badge color="blue" variant="light" size="sm">
                #{product.cardNumber}
              </Badge>
            )}
          </Group>

          {/* Subtypes and Prices */}
          {pricesLoading ? (
            <>
              <Divider my="sm" />
              <Stack gap="xs">
                <Skeleton height={28} width="60%" />
                <Skeleton height={28} width="50%" />
              </Stack>
            </>
          ) : (
            subtypes &&
            subtypes.length > 0 && (
              <>
                <Divider my="sm" />
                <Stack gap="xs">
                  {subtypes.map((subtype, index) => (
                    <Stack key={index} gap={4}>
                      {subtype.latestPrice ? (
                        <Group gap="xs">
                          {subtype.latestPrice.marketPrice && (
                            <Badge
                              color="green"
                              variant="light"
                              size="md"
                            >
                              {subtype.subTypeName}{' '}
                              {formatPrice(
                                subtype.latestPrice.marketPrice
                              )}
                            </Badge>
                          )}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">
                          No price data available
                        </Text>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </>
            )
          )}

          {/* Action Buttons */}
          <Stack gap="xs" mt="md">
            {/* See More Info Button */}
            <Button
              onClick={openModal}
              leftSection={<IconInfoCircle size={16} />}
              variant="filled"
              fullWidth
            >
              See More Info
            </Button>

            {/* TCGPlayer Link */}
            {product.url && (
              <Button
                component="a"
                href={`${product.url}?Language=English&Condition=Near+Mint&page=1`}
                target="_blank"
                rel="noopener noreferrer"
                rightSection={<IconExternalLink size={16} />}
                variant="light"
                fullWidth
              >
                View on TCGPlayer
              </Button>
            )}
          </Stack>
        </Stack>
      </Group>

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={product.productId}
        opened={modalOpened}
        onClose={closeModal}
      />
    </Card>
  );
}
