import { useState } from 'react';
import { redirect, Outlet, useNavigate } from 'react-router';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  ActionIcon,
  Stack,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconChartBar,
  IconDeviceGamepad2,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { authClient } from '../lib/auth';
import type { Route } from './+types/admin';

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const { data: session } = await authClient.getSession();

  // Redirect to home if not authenticated
  if (!session?.user) {
    throw redirect('/');
  }

  // Return user data to all child routes
  return { user: session.user };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const { user } = loaderData;

  async function handleSignOut() {
    await authClient.signOut();
    navigate('/');
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>🎮 Tabiheim Games</Title>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {user.email}
            </Text>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <NavLink
            href="/dashboard"
            label="Dashboard"
            leftSection={<IconDashboard size={20} />}
            active={window.location.pathname === '/dashboard'}
          />
          <NavLink
            label="Analytics"
            leftSection={<IconChartBar size={20} />}
            disabled
            description="Coming soon"
          />
          <NavLink
            label="Games"
            leftSection={<IconDeviceGamepad2 size={20} />}
            disabled
            description="Coming soon"
          />
          <NavLink
            label="Settings"
            leftSection={<IconSettings size={20} />}
            disabled
            description="Coming soon"
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

