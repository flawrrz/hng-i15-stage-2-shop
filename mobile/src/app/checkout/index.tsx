import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { buildCheckoutPayload, calculateTotals, placeOrder } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/cart-store';
import { colors, fonts, radius } from '@/theme/theme';

type FormData = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  phone: '',
};

// Same options as the web checkout's country <select>.
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
];

/**
 * Checkout form — the mobile twin of src/app/checkout/page.tsx.
 * Posts to the same /api/checkout route handler (guest checkout works; if the
 * user is signed in the server attaches their user_id via the session).
 */
export default function CheckoutScreen() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>(() => {
    // Prefill what we already know about the signed-in user.
    return {
      ...initialFormData,
      email: user?.email ?? '',
      firstName: (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? '',
      lastName:
        (user?.user_metadata?.full_name as string | undefined)?.split(' ').slice(1).join(' ') ??
        '',
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { shipping, tax, total } = calculateTotals(subtotal);

  /** Validation messages match the web form word for word. */
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    return newErrors;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildCheckoutPayload({
        items,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        subtotal,
      });

      const orderId = await placeOrder(payload);

      clearCart();
      router.replace({ pathname: '/checkout/success', params: { orderId } });
    } catch (error) {
      console.error('Checkout failed:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty-cart guard, same as the web checkout page.
  if (items.length === 0) {
    return (
      <EmptyState
        icon="cart-outline"
        title="Your cart is empty"
        message="Add some products before checking out."
        actionTitle="Browse Products"
        onAction={() => router.push('/')}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Checkout' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact</Text>
        <TextField
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />

        {/* Shipping address */}
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="First name"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="John"
              autoComplete="name-given"
              error={errors.firstName}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label="Last name"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Doe"
              autoComplete="name-family"
              error={errors.lastName}
            />
          </View>
        </View>

        <TextField
          label="Address"
          value={formData.address}
          onChangeText={(value) => handleChange('address', value)}
          placeholder="123 Main Street"
          autoComplete="street-address"
          error={errors.address}
        />
        <TextField
          label="Apartment, suite, etc. (optional)"
          value={formData.apartment}
          onChangeText={(value) => handleChange('apartment', value)}
          placeholder="Apt 4B"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="City"
              value={formData.city}
              onChangeText={(value) => handleChange('city', value)}
              placeholder="Ikeja"
              error={errors.city}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label="State"
              value={formData.state}
              onChangeText={(value) => handleChange('state', value)}
              placeholder="Lagos"
              autoCapitalize="characters"
              error={errors.state}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="ZIP code"
              value={formData.zipCode}
              onChangeText={(value) => handleChange('zipCode', value)}
              placeholder="100001"
              keyboardType="numbers-and-punctuation"
              error={errors.zipCode}
            />
          </View>
          <View style={styles.half}>
            {/* Country picker as a compact chip row (native pickers vary by platform) */}
            <Text style={styles.countryLabel}>Country</Text>
            <View style={styles.countryRow}>
              {COUNTRIES.map((country) => {
                const active = formData.country === country.value;
                return (
                  <Text
                    key={country.value}
                    onPress={() => handleChange('country', country.value)}
                    style={[styles.countryChip, active && styles.countryChipActive]}
                  >
                    {country.value}
                  </Text>
                );
              })}
            </View>
          </View>
        </View>

        <TextField
          label="Phone"
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          placeholder="+234 801 234 5678"
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
        />

        {/* Order summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {items.map((item) => (
            <View key={item.product_id} style={styles.summaryItem}>
              <Image
                source={item.image_url ? { uri: item.image_url } : undefined}
                style={styles.summaryImage}
                contentFit="cover"
                alt={item.title}
              />
              <View style={styles.flex}>
                <Text style={styles.summaryName} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.summaryMeta}>Qty {item.quantity}</Text>
              </View>
              <Text style={styles.summaryPrice}>
                {formatNaira(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>
              {shipping === 0 ? 'Free' : formatNaira(shipping)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax (7.5%)</Text>
            <Text style={styles.summaryValue}>{formatNaira(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatNaira(total)}</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <Button
          title={`Place Order — ${formatNaira(total)}`}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        />

        <Text style={styles.secureNote}>
          <Ionicons name="lock-closed" size={12} color={colors.inkMuted} /> Order details are
          processed securely
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    // Section heading → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  countryLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    marginBottom: 6,
  },
  countryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  countryChip: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.inkSoft,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  countryChipActive: {
    color: colors.white,
    backgroundColor: colors.leaf,
    borderColor: colors.leaf,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  summaryName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  summaryMeta: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.inkSoft,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 6,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.bodyExtraBold,
    color: colors.ink,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.dangerDark,
  },
  submitButton: {
    marginTop: 4,
  },
  secureNote: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
