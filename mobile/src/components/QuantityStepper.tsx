import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/lib/theme';

interface QuantityStepperProps {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

/** The +/- quantity control used on the product page and in the cart. */
export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantityStepperProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={quantity <= min}
        onPress={() => onChange(quantity - 1)}
        style={({ pressed }) => [
          styles.button,
          quantity <= min && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.sign}>−</Text>
      </Pressable>

      <Text style={styles.quantity}>{quantity}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={quantity >= max}
        onPress={() => onChange(quantity + 1)}
        style={({ pressed }) => [
          styles.button,
          quantity >= max && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.sign}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    backgroundColor: colors.gray100,
  },
  sign: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray700,
  },
  quantity: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
});
