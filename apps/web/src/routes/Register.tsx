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
import { signUp, useSession } from '@/lib/auth';
import { useEffect } from 'react';

/**
 * Register Page
 *
 * Allows users to create a new account with email and password using Better-Auth
 * Redirects to dashboard on successful registration
 */
export function Register() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await signUp.email({
        email,
        password,
        name,
      });

      // Navigation will happen automatically via useEffect when session updates
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Create Account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Join Tabiheim Games today
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
              label="Name"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              disabled={loading}
            />

            <TextInput
              label="Email"
              placeholder="your@email.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              disabled={loading}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              disabled={loading}
            />

            <Button type="submit" fullWidth loading={loading}>
              Create account
            </Button>

            <Text ta="center" size="sm">
              Already have an account?{' '}
              <Anchor component={Link} to="/login" size="sm">
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

