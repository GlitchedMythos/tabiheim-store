import {
  Box,
  Button,
  Center,
  Group,
  PinInput,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { signInWithMagicLink, verifyOtp } from '~/lib/auth';

interface MagicLinkCodeVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function MagicLinkCodeVerification({
  email,
  onBack,
  onSuccess,
}: MagicLinkCodeVerificationProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeSubmit = async () => {
    if (code.length !== 6) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a 6-digit code',
        color: 'red',
      });
      return;
    }

    setIsLoading(true);
    console.log('Verifying code for:', email);

    const result = await verifyOtp(email, code);
    console.log('Verification result:', result);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: result.message || 'Successfully signed in!',
        color: 'green',
      });

      // Call onSuccess callback
      onSuccess();

      // Trigger page refresh to update auth state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      notifications.show({
        title: 'Error',
        message: result.error || 'Failed to verify code',
        color: 'red',
      });
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    const result = await signInWithMagicLink(email);

    if (result.success) {
      notifications.show({
        title: 'Code Resent',
        message: 'A new code has been sent to your email.',
        color: 'green',
      });
    } else {
      notifications.show({
        title: 'Error',
        message: result.error || 'Failed to resend code',
        color: 'red',
      });
    }

    setIsLoading(false);
  };

  return (
    <Stack gap="md">
      <Box>
        <Title order={4}>Enter verification code</Title>
        <Text size="sm" c="dimmed" mt="xs">
          We sent a 6-digit code to <strong>{email}</strong>
        </Text>
      </Box>

      <Center>
        <PinInput
          length={6}
          size="md"
          type="number"
          value={code}
          onChange={setCode}
          disabled={isLoading}
          onComplete={handleCodeSubmit}
        />
      </Center>

      <Button
        onClick={handleCodeSubmit}
        fullWidth
        loading={isLoading}
        disabled={code.length !== 6}
      >
        Verify Code
      </Button>

      <Group justify="space-between">
        <Button
          variant="subtle"
          onClick={onBack}
          disabled={isLoading}
        >
          Change Email
        </Button>
        <Button
          variant="subtle"
          onClick={handleResendCode}
          disabled={isLoading}
        >
          Resend Code
        </Button>
      </Group>
    </Stack>
  );
}
