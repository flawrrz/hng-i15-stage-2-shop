import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { shortOrderId } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/theme/theme';

/**
 * Order confirmation — shown with router.replace so the back gesture can't
 * return to the (now empty) checkout form.
 */
export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Order Confirmed', headerBackVisible: false }} />

      <View style={styles.badge}>
        <Ionicons name="checkmark" size={44} color={colors.white} />
      </View>

      <Text style={styles.title}>Thank you for your order!</Text>
      <Text style={styles.message}>
        We&apos;ve received your order and sent a confirmation email with the details.
      </Text>

      {orderId ? (
        <View style={styles.orderChip}>
          <Text style={styles.orderChipLabel}>Order reference</Text>
          <Text style={styles.orderChipValue}>#{shortOrderId(orderId)}</Text>
        </View>
      ) : null}

      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>What happens next?</Text>
        <Step icon="mail-outline" text="Confirmation email arrives shortly" />
        <Step icon="cube-outline" text="We process your order in 1–2 business days" />
        <Step icon="car-outline" text="Tracking info arrives when it ships" />
      </View>

      <View style={styles.actions}>
        <Button title="Continue Shopping" onPress={() => router.replace('/')} />
        {user ? (
          <Button
            title="View My Orders"
            variant="outline"
            onPress={() => router.replace('/account')}
          />
        ) : null}
      </View>
    </View>
  );
}

function Step({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.stepRow}>
      <Ionicons name={icon} size={18} color={colors.leafDark} />
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    // Success = leaf green (the design system's positive color).
    backgroundColor: colors.leaf,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    // Confirmation headline → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 20,
  },
  orderChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  orderChipLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    marginBottom: 2,
  },
  orderChipValue: {
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    letterSpacing: 1,
  },
  stepsCard: {
    alignSelf: 'stretch',
    // Mint info card (replaces the old blue info box).
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.leafSoft,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.leafDark,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    flex: 1,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
