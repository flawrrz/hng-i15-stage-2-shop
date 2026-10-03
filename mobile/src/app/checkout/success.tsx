import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { shortOrderId } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';

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
      <Ionicons name={icon} size={18} color={colors.gray500} />
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
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 20,
  },
  orderChip: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  orderChipLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 2,
  },
  orderChipValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
    letterSpacing: 1,
  },
  stepsCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.info,
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
    color: colors.info,
    flex: 1,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
