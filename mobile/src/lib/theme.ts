/**
 * Design tokens for the shop app.
 * The values mirror the Tailwind palette used by the web app
 * (gray-50 ... gray-900) so both apps look like the same product.
 *
 * Gray is flattened (gray500 rather than gray[500]) because these are
 * referenced as StyleSheet values in many files and flat keys read better.
 */

export const colors = {
  black: '#000000',
  white: '#ffffff',

  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  success: '#10b981',
  successBg: '#ecfdf5',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  warning: '#f59e0b',
  info: '#0369a1',
  infoBg: '#f0f9ff',
  infoBorder: '#bae6fd',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/** Spacing helper: spacing(4) === Tailwind's `gap-1`/`p-1` (4px). */
export const spacing = (value: number): number => value * 4;

/** Order status → pill colors, matching the status colors in the web app. */
export const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fffbeb', text: '#b45309' },
  confirmed: { bg: '#eff6ff', text: '#1d4ed8' },
  shipped: { bg: '#eef2ff', text: '#4338ca' },
  delivered: { bg: colors.successBg, text: '#047857' },
  cancelled: { bg: colors.dangerBg, text: '#b91c1c' },
};
