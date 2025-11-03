import { Button, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { signInWithMagicLink } from '~/lib/auth';
import { MagicLinkCodeVerification } from './MagicLinkCodeVerification';

const emailSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export function MagicLinkEmailForm() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm({
    initialValues: {
      email: '',
    },
    validate: zod4Resolver(emailSchema),
  });

  const handleEmailSubmit = async (
    values: typeof emailForm.values
  ) => {
    setIsLoading(true);
    console.log('Sending magic link to:', values.email);

    const result = await signInWithMagicLink(values.email);
    console.log('Magic link result:', result);

    if (result.success) {
      setEmail(values.email);
      setStep('code');
      notifications.show({
        title: 'Success',
        message:
          result.message ||
          'Magic link sent! Check your email for the code.',
        color: 'green',
      });
    } else {
      notifications.show({
        title: 'Error',
        message: result.error || 'Failed to send magic link',
        color: 'red',
      });
    }

    setIsLoading(false);
  };

  const handleBack = () => {
    setStep('email');
  };

  const handleVerificationSuccess = () => {
    // Reset form state
    setStep('email');
    setEmail('');
    emailForm.reset();
  };

  if (step === 'code') {
    return (
      <MagicLinkCodeVerification
        email={email}
        onBack={handleBack}
        onSuccess={handleVerificationSuccess}
      />
    );
  }

  return (
    <form onSubmit={emailForm.onSubmit(handleEmailSubmit)}>
      <Title order={4}>Sign in with email</Title>
      <Text size="sm" c="dimmed" mt="xs" mb="md">
        Enter your email to receive a verification code
      </Text>
      <Stack gap="md">
        <TextInput
          size="md"
          label="Email"
          placeholder="Enter your email"
          required
          {...emailForm.getInputProps('email')}
          disabled={isLoading}
          spellCheck={false}
          autoComplete="email"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <Button type="submit" fullWidth loading={isLoading}>
          Continue
        </Button>
      </Stack>
    </form>
  );
}
