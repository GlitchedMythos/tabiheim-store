import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Stack,
  Text,
} from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { Product } from '../lib/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
          {product.subtypes && product.subtypes.length > 0 && (
            <>
              <Divider my="sm" />
              <Stack gap="xs">
                {product.subtypes.map((subtype, index) => (
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
          )}

          {/* TCGPlayer Link */}
          {product.url && (
            <Button
              component="a"
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              rightSection={<IconExternalLink size={16} />}
              variant="light"
              fullWidth
              mt="md"
            >
              View on TCGPlayer
            </Button>
          )}
        </Stack>
      </Group>
    </Card>
  );
}
