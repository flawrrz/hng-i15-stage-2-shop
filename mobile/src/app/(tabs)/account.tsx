import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, format, shortOrderId } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, radius, statusColors } from '@/lib/theme';
import type { OrderWithItems } from '@/lib/types';

type Mode = 'signin' | 'signup';

/**
 * Account tab.
 * Signed out: email/password sign-in or sign-up plus Google OAuth.
 * Signed in: profile, order history (fetched with the user's own session, so
 * RLS guarantees they only see their orders) and sign out.
 */
export default function AccountScreen() {
  const { user, loading, signInWithPassword, signUpWithPassword, signInWithGoogle, signOut, authError } =
    useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Refresh orders whenever this tab regains focus (e.g. after checkout).
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      let cancelled = false;
      setOrdersLoading(true);

      supabase
        .from('orders')
        .select(
          `*, order_items (*, products (title, image_url))`
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            console.error('Failed to load orders:', error);
          } else {
            setOrders((data as OrderWithItems[]) ?? []);
          }
          setOrdersLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [user])
  );

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email';
    }
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setBusy(true);
    setFormError(null);
    setNotice(null);

    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password);
      } else {
        const signedInImmediately = await signUpWithPassword(email.trim(), password);
        if (!signedInImmediately) {
          setNotice(
            'Check your inbox — we sent you a confirmation link to finish creating your account.'
          );
          setPassword('');
        }
      }
    } catch (error) {
      console.error(mode === 'signin' ? 'Sign in failed' : 'Sign up failed', error);
      setFormError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch {
      // Error surfaced through authError / formError below.
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out failed:', error);
            Alert.alert('Sign out failed', 'Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  // ── Signed out ────────────────────────────────────────────────────────────
  if (!user) {
    const errorMessage = formError ?? authError;

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authIcon}>
            <Ionicons name="person-outline" size={32} color={colors.gray500} />
          </View>
          <Text style={styles.authTitle}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.authSubtitle}>
            {mode === 'signin'
              ? 'Sign in to see your orders and check out faster.'
              : 'Join the shop to track orders and save your details.'}
          </Text>

          {/* Mode switch */}
          <View style={styles.segment}>
            {(['signin', 'signup'] as Mode[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  // Clear stale messages when switching between sign-in and sign-up.
                  setMode(option);
                  setFormError(null);
                  setNotice(null);
                }}
                style={[styles.segmentItem, mode === option && styles.segmentActive]}
              >
                <Text
                  style={[styles.segmentText, mode === option && styles.segmentTextActive]}
                >
                  {option === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min. 6 characters)"
            placeholderTextColor={colors.gray400}
            secureTextEntry
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            style={styles.input}
          />

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.noticeBox}>
              <Ionicons name="mail-outline" size={16} color={colors.info} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <Button
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={busy}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with Google"
            variant="outline"
            onPress={handleGoogle}
            loading={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Signed in ─────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.signedInContent}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.email ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user.email}
          </Text>
          <Text style={styles.profileMeta}>
            Member since{' '}
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Order History</Text>

      {ordersLoading ? (
        <ActivityIndicator style={styles.ordersLoader} color={colors.black} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No orders yet"
          message="When you place an order it will show up here."
          actionTitle="Start Shopping"
          onAction={() => router.push('/')}
        />
      ) : (
        orders.map((order) => {
          const status = statusColors[order.status] ?? statusColors.pending;
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{shortOrderId(order.id)}</Text>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.text }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>

              {(order.order_items ?? []).map((item) => (
                <View key={item.id} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName} numberOfLines={1}>
                    {item.products?.title ?? 'Product'}{' '}
                    <Text style={styles.orderItemQty}>× {item.quantity}</Text>
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    ${format(item.price_at_purchase * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.orderTotalRow}>
                <Text style={styles.orderTotalLabel}>Total</Text>
                <Text style={styles.orderTotalValue}>
                  ${format(order.total_amount)}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <Button
        title="Sign Out"
        variant="outline"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
  },
  // ── Signed-out layout ──
  authContent: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: colors.gray50,
  },
  authIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 15,
    color: colors.gray500,
    lineHeight: 21,
    marginBottom: 24,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray500,
  },
  segmentTextActive: {
    color: colors.gray900,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.infoBg,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    fontSize: 13,
    color: colors.gray400,
  },
  // ── Signed-in layout ──
  signedInContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.gray50,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.gray900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  profileMeta: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 14,
  },
  ordersLoader: {
    marginVertical: 24,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDate: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: colors.gray700,
    marginRight: 8,
  },
  orderItemQty: {
    color: colors.gray400,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: 8,
    paddingTop: 10,
  },
  orderTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  orderTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  signOut: {
    marginTop: 20,
  },
});
