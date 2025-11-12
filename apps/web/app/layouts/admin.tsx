import {
  AppShell,
  Avatar,
  Burger,
  Group,
  NavLink as MantineNavLink,
  Menu,
  Stack,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconDeviceGamepad2,
  IconFileSearch,
  IconLogout,
  IconMoonStars,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import {
  Outlet,
  NavLink as ReactRouterNavLink,
  redirect,
  useNavigate,
} from 'react-router';
import { useColorScheme } from '../hooks/useColorScheme';
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

export default function AdminLayout({
  loaderData,
}: Route.ComponentProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const { computedColorScheme, toggleColorScheme } = useColorScheme();

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
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3}>🎮 Tabiheim Games</Title>
          </Group>
          <Group gap="xs">
            <Menu withArrow>
              <Menu.Target>
                <Avatar
                  style={{
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={
                    computedColorScheme === 'dark' ? (
                      <IconSun size={14} />
                    ) : (
                      <IconMoonStars size={14} />
                    )
                  }
                  onClick={toggleColorScheme}
                >
                  {computedColorScheme === 'dark'
                    ? 'Light Mode'
                    : 'Dark Mode'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={handleSignOut}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <MantineNavLink
            component={ReactRouterNavLink}
            to="/dashboard"
            label="Dashboard"
            leftSection={<IconDashboard size={20} />}
            active={window.location.pathname === '/dashboard'}
          />
          <MantineNavLink
            component={ReactRouterNavLink}
            to="/products"
            label="Products"
            leftSection={<IconFileSearch size={20} />}
            active={window.location.pathname === '/products'}
          />
          <MantineNavLink
            component={ReactRouterNavLink}
            to="/games"
            label="Games"
            leftSection={<IconDeviceGamepad2 size={20} />}
            disabled
          />
          <MantineNavLink
            component={ReactRouterNavLink}
            to="/settings"
            label="Settings"
            leftSection={<IconSettings size={20} />}
            disabled
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
