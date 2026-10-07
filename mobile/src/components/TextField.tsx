import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Validation message; shown in red under the field when present. */
  error?: string;
}

/**
 * Labeled input used by the checkout and auth forms. The label sits above the
 * field (better for small screens than placeholder-only inputs), errors
 * render inline (matching the web app's validation messages), and the border
 * turns leaf-green while focused — the native equivalent of the web app's
 * focus ring.
 */
export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        // Spread first so our focus handlers below always run; they forward
        // to any onFocus/onBlur the caller passed in.
        {...inputProps}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.leaf,
    // 2px-equivalent emphasis without changing layout: thicken the border.
    borderWidth: 2,
    paddingHorizontal: 13, // keep the text from shifting when the border grows
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.dangerDark,
  },
});
