import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from './Button';
import { subscribeToNewsletter } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/theme';

/**
 * Newsletter sign-up (posts to the web app's /api/newsletter route).
 * Success/error messages appear inline, matching the web footer behavior.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await subscribeToNewsletter(trimmed);
      setStatus('success');
      setEmail('');
    } catch (submitError) {
      console.error('Newsletter signup failed:', submitError);
      setError(
        submitError instanceof Error ? submitError.message : 'Could not subscribe'
      );
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.successBox}>
        <Text style={styles.successText}>
          You&apos;re subscribed! Check your inbox for a welcome email.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
        }}
        placeholder="Enter your email"
        placeholderTextColor={colors.inkMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        style={[styles.input, error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title="Subscribe"
        onPress={handleSubmit}
        loading={status === 'loading'}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.ink,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.dangerDark,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 8,
  },
  button: {
    marginTop: 4,
  },
  successBox: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 16,
  },
  successText: {
    color: colors.leafDark,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    lineHeight: 22,
  },
});
