import {
  Badge,
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useRouteLoaderData } from 'react-router';
import type { Route } from './+types/dashboard';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Tabiheim Games' },
    { name: 'description', content: 'Your Tabiheim Games dashboard' },
  ];
}

export default function Dashboard() {
  // Get user data from parent layout loader
  const layoutData = useRouteLoaderData('admin') as
    | { user?: { id: string; email: string; name?: string } }
    | undefined;
  const user = layoutData?.user;

  return (
    <Stack gap="lg">
      <Paper shadow="sm" p="xl" radius="md">
        <Stack gap="md">
          <div>
            <Title order={1} mb="xs">
              Welcome to your Dashboard!
            </Title>
            <Text size="lg" c="dimmed">
              Hello,{' '}
              <Text span fw={700}>
                {user?.email}
              </Text>
            </Text>
          </div>

          <Paper withBorder p="lg" radius="md" bg="violet.0">
            <Stack gap="md">
              <div>
                <Title order={3} mb="sm">
                  👋 Hello World!
                </Title>
                <Text mb="md">
                  This is a protected dashboard page. You can only see
                  this because you're authenticated.
                </Text>
              </div>

              <Paper withBorder p="md" radius="md" bg="white">
                <Title order={4} mb="sm">
                  Your Details:
                </Title>
                <Stack gap="xs">
                  <Group>
                    <Text fw={500} w={100}>
                      User ID:
                    </Text>
                    <Text>{user?.id}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={100}>
                      Email:
                    </Text>
                    <Text>{user?.email}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={100}>
                      Name:
                    </Text>
                    <Text>{user?.name || 'Not set'}</Text>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Paper>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder padding="lg" radius="md" bg="blue.0">
              <Stack gap="xs">
                <Text size="xl">📊</Text>
                <Title order={4}>Analytics</Title>
                <Badge color="blue" variant="light">
                  Coming soon
                </Badge>
              </Stack>
            </Card>

            <Card withBorder padding="lg" radius="md" bg="green.0">
              <Stack gap="xs">
                <Text size="xl">🎯</Text>
                <Title order={4}>Games</Title>
                <Badge color="green" variant="light">
                  Coming soon
                </Badge>
              </Stack>
            </Card>

            <Card withBorder padding="lg" radius="md" bg="yellow.0">
              <Stack gap="xs">
                <Text size="xl">⚙️</Text>
                <Title order={4}>Settings</Title>
                <Badge color="yellow" variant="light">
                  Coming soon
                </Badge>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
}
