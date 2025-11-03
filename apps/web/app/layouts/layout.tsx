import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, redirect } from 'react-router';
import { Navbar } from '~/components/navbar';
import { ThemeToggle } from '~/components/theme-toggle';
import { getCurrentUser } from '~/lib/auth';
import type { Route } from './+types/layout';

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const user = await getCurrentUser();
  if (!user) {
    return redirect('/');
  }

  return { user };
}

export default function Layout() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: { base: 60, md: 70, lg: 80 } }}
      navbar={{
        width: { base: 200, md: 250, lg: 300 },
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <Text
            fw={700}
            size="lg"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            Tabiheim
          </Text>
          <ThemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Navbar onClose={close} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
