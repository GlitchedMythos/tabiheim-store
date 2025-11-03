import {
  Card,
  Center,
  Container,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { redirect } from 'react-router';
import { SimpleHeader } from '~/components/header';
import { MagicLinkEmailForm } from '~/components/signIn';
import { getCurrentUser } from '~/lib/auth';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Home - Tabiheim Store' },
    {
      name: 'description',
      content: 'Home page of Tabiheim',
    },
  ];
}

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const user = await getCurrentUser();
  if (user) {
    return redirect('/dashboard');
  }
  return { user: null };
}

export default function Home() {
  return (
    <>
      <SimpleHeader />
      <Container h="calc(100vh - 56px)" size="md">
        <Center py="xl">
          <Stack justify="center">
            <Card withBorder radius="md">
              <Stack gap="xs">
                <Text
                  component={Title}
                  order={2}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Welcome to Tabiheim
                </Text>
                <MagicLinkEmailForm />
              </Stack>
            </Card>
          </Stack>
        </Center>
      </Container>
    </>
  );
}
