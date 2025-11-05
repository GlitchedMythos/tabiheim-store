import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Stack,
  Alert,
} from '@mantine/core';
import { signIn, useSession } from '@/lib/auth';
import { useEffect } from 'react';

/**
 * Login Page
 *
 * Allows users to sign in with email and password using Better-Auth
 * Redirects to dashboard on successful login
 */
export function Login() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn.email({
        email,
        password,
      });

      // Navigation will happen automatically via useEffect when session updates
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Welcome to Tabiheim Games
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Sign in to your account to continue
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert color="red" title="Error">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              disabled={loading}
            />

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>

            <Text ta="center" size="sm">
              Don't have an account?{' '}
              <Anchor component={Link} to="/register" size="sm">
                Create account
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

