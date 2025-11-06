import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Center,
  Alert,
  Anchor,
  Loader,
} from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { authClient } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign In - Tabiheim Games' },
    { name: 'description', content: 'Sign in to Tabiheim Games' },
  ];
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use absolute URL for callback to ensure redirect goes to frontend, not API
      const callbackURL = `${window.location.origin}/dashboard`;

      await authClient.signIn.magicLink({
        email,
        callbackURL,
      });
      setSent(true);
    } catch (err) {
      console.error('Failed to send magic link:', err);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <Center
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        }}
      >
        <Stack align="center" gap="md">
          <Loader size="lg" color="white" />
          <Text c="white" size="xl">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  if (sent) {
    return (
      <Center
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          padding: '1rem',
        }}
      >
        <Paper shadow="xl" p="xl" radius="md" style={{ maxWidth: 450, width: '100%' }}>
          <Stack align="center" gap="md">
            <Text size="4rem">📧</Text>
            <Title order={2} ta="center">
              Check Your Email
            </Title>
            <Text ta="center" c="dimmed">
              We've sent a magic link to <Text span fw={700}>{email}</Text>
            </Text>
            <Text size="sm" ta="center" c="dimmed">
              Click the link in the email to sign in to your account.
              The link will expire in 5 minutes.
            </Text>
            <Anchor
              component="button"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
            >
              Use a different email
            </Anchor>
          </Stack>
        </Paper>
      </Center>
    );
  }

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '1rem',
      }}
    >
      <Paper shadow="xl" p="xl" radius="md" style={{ maxWidth: 450, width: '100%' }}>
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Title order={1} ta="center">
              🎮 Tabiheim Games
            </Title>
            <Text c="dimmed" ta="center">
              Sign in with your email
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                disabled={loading}
                size="md"
                leftSection={<IconMail size={16} />}
              />

              {error && (
                <Alert color="red" title="Error">
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                size="md"
                loading={loading}
                fullWidth
              >
                Send Magic Link
              </Button>
            </Stack>
          </form>

          <Text size="sm" c="dimmed" ta="center">
            We'll send you a secure link to sign in.
            <br />
            No password required! 🪄
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
