import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  /** Full width by default; pass false to size the button to its label. */
  fullWidth?: boolean;
  style?: ViewStyle;
}

interface VariantStyle {
  container: ViewStyle;
  label: TextStyle;
}

// Plain typed object rather than StyleSheet.create: each variant pairs a
// container style with a label style, and StyleSheet.create would type every
// entry as a generic style.
//
// Variant colors mirror the web app's Button (src/components/Button.tsx):
// primary = leaf green, outline = ink border on white, ghost = quiet ink.
const variantStyles: Record<NonNullable<ButtonProps['variant']>, VariantStyle> = {
  primary: {
    container: { backgroundColor: colors.leaf },
    label: { color: colors.white },
  },
  outline: {
    container: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.ink,
    },
    label: { color: colors.ink },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.inkSoft },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    label: { color: colors.white },
  },
};

/**
 * The one button style in the app — solid leaf-green primary like the web
 * app's Button component, with outline/ghost/danger variants.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant].container,
        // Pressed feedback: primary darkens to leaf-dark (web hover state),
        // the others just dim so the label keeps its contrast.
        pressed && !isDisabled && variant === 'primary' && styles.primaryPressed,
        pressed && !isDisabled && variant !== 'primary' && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger' ? colors.white : colors.ink
          }
        />
      ) : (
        <Text style={[styles.label, variantStyles[variant].label]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primaryPressed: {
    backgroundColor: colors.leafDark,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
