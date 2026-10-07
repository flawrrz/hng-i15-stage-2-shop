import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { colors, fonts } from '@/theme/theme';

/**
 * Deep-link landing route for email confirmation links
 * (redirect target set in signUp: makeRedirectUri({ path: 'auth/callback' })).
 *
 * The AuthProvider already turns the URL into a session via Linking — this
 * screen just shows progress and sends the user onward once signed in.
 */
export default function AuthCallbackScreen() {
  const { session, loading, authError } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      // replace: the callback step shouldn't sit in the back stack.
      router.replace('/');
    }
  }, [loading, session]);

  if (authError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Sign-in link didn&apos;t work</Text>
        <Text style={styles.message}>{authError}</Text>
        <Text style={styles.link} onPress={() => router.replace('/')}>
          Back to the shop
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.leaf} />
      <Text style={styles.message}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.white,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  errorTitle: {
    // Screen headline → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  link: {
    marginTop: 20,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.leaf,
  },
});
