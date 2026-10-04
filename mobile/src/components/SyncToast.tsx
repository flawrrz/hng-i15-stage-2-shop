import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useToastStore } from '@/lib/toast-store';
import { colors, radius } from '@/lib/theme';

/**
 * Renders the toast queue (lib/toast-store.ts) as a floating stack near the
 * bottom of the screen. Mounted once in the root layout after the navigator
 * so it floats over every screen. Tapping a toast dismisses it early; each
 * toast also expires on its own. Mirrors web's ToastHost component.
 */
export function SyncToast() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      style={styles.host}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          onPress={() => dismiss(toast.id)}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss notification: ${toast.text}`}
          style={styles.toast}
        >
          <Text style={styles.text}>{toast.text}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    // Clears the bottom tab bar so the toast never hides behind it.
    bottom: 96,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    elevation: 8, // Android: raises the toast above the screens below it
  },
  toast: {
    backgroundColor: colors.gray900,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
