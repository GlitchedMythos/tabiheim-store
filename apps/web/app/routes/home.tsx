import {
  Button,
  Card,
  Center,
  Container,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Notifications } from '@mantine/notifications';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { redirect } from 'react-router';
import { z } from 'zod';
import { SimpleHeader } from '~/components/header';
import { getCurrentUser, signInWithMagicLink } from '~/lib/auth';
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

const schema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export default function Home() {
  // const hasCheckedUserRef = useRef(false);
  // const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: zod4Resolver(schema),
  });

  const handleSubmit = async function (values: typeof form.values) {
    console.log('the values: ', values);
    const result = await signInWithMagicLink(values.email);
    console.log(result);

    if (result.success) {
      Notifications.show({
        title: 'Success',
        message:
          result.message ||
          'Magic link sent! Check your email to sign in.',
        color: 'green',
      });

      form.reset();
    } else {
      Notifications.show({
        title: 'Error',
        message: result.error || 'Failed to send magic link',
        color: 'red',
      });
    }
  };

  // useEffect(() => {
  //   if (hasCheckedUserRef.current) return;
  //   hasCheckedUserRef.current = true;

  //   async function checkUser() {
  //     const user = await getCurrentUser();
  //     console.log(user);

  //     if (user) {
  //       navigate('/dashboard');
  //     }
  //   }

  //   checkUser();
  // }, []);

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
                <Title order={6}>Please enter your email.</Title>
                <form
                  onSubmit={form.onSubmit((values) =>
                    handleSubmit(values)
                  )}
                >
                  <Stack gap="xs">
                    <TextInput
                      label="Email"
                      placeholder="Enter your email"
                      required
                      {...form.getInputProps('email')}
                    />
                    <Button type="submit" fullWidth>
                      Continue
                    </Button>
                  </Stack>
                </form>
              </Stack>
            </Card>
          </Stack>
        </Center>
      </Container>
    </>
  );
}
