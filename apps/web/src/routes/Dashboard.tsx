import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Badge,
  Divider,
} from '@mantine/core';
import { useSession, signOut } from '@/lib/auth';

/**
 * Dashboard Page (Protected)
 *
 * Displays user information and provides logout functionality
 * Only accessible to authenticated users
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <Container size="lg" my={40}>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Dashboard</Title>
            <Text c="dimmed" size="sm">
              Welcome back, {session.user.name || 'User'}!
            </Text>
          </div>
          <Button onClick={handleLogout} variant="outline" color="red">
            Logout
          </Button>
        </Group>

        <Divider />

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack>
            <Group justify="space-between">
              <Title order={3}>User Information</Title>
              <Badge color="green">Authenticated</Badge>
            </Group>

            <Divider />

            <Stack gap="sm">
              <div>
                <Text size="sm" fw={500} c="dimmed">
                  Name
                </Text>
                <Text size="lg">{session.user.name || 'Not provided'}</Text>
              </div>

              <div>
                <Text size="sm" fw={500} c="dimmed">
                  Email
                </Text>
                <Text size="lg">{session.user.email}</Text>
              </div>

              <div>
                <Text size="sm" fw={500} c="dimmed">
                  User ID
                </Text>
                <Text size="sm" ff="monospace" c="dimmed">
                  {session.user.id}
                </Text>
              </div>
            </Stack>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack>
            <Title order={3}>Getting Started</Title>
            <Text size="sm" c="dimmed">
              This is a protected dashboard page. You can only access this page when you're
              logged in. Here you can add features like:
            </Text>
            <Stack gap="xs" ml="md">
              <Text size="sm">• View and manage your game library</Text>
              <Text size="sm">• Track your achievements and progress</Text>
              <Text size="sm">• Connect with other players</Text>
              <Text size="sm">• Customize your profile settings</Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

