/**
 * The Green Gazette™ design tokens — the single source of truth for colors,
 * typography, radii and spacing in the mobile app.
 *
 * The palette mirrors the Tailwind tokens in the web app's
 * src/app/globals.css so both apps read as one product:
 *
 *   ink      warm near-black — primary text + dark banners
 *   leaf     mid green — primary buttons, links, accents
 *   sun      yellow — playful sticker badges + warnings
 *   surface  off-white page tint, mint/sage — soft green washes
 *
 * Why a central file? StyleSheet values are declared far from the JSX that
 * uses them, so hardcoding hexes (the old approach) made a rebrand a
 * file-by-file scavenger hunt. Everything imports from here instead.
 */

export const colors = {
  // ── Brand core (Green Gazette) ──────────────────────────────────────────
  ink: '#2C2825', // primary text / dark banners (warm black)
  inkSoft: '#565656', // secondary text (matches web --color-ink-soft)
  leaf: '#486C49', // primary green: buttons, links, accents
  leafDark: '#3A5A3B', // pressed / hover green (matches web --color-leaf-dark)
  leafSoft: '#8E9B77', // sage: subtle accents (matches web --color-leaf-soft)
  sage: '#8E9B77', // muted olive-green: subtle accents (shipped status)
  sun: '#FFC700', // yellow: sticker badges, warnings, highlights
  mint: '#DEECC5', // light green: tints, success washes
  surface: '#F7F7F7', // off-white page tint
  line: '#E8E8E8', // dividers, hairlines, input borders

  // ── Neutrals ────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',

  /**
   * Muted ink for placeholder text and quiet icons. inkSoft is too dark for
   * glyphs that must recede behind real content; this is ink warmed down to
   * roughly the same prominence the web app gives gray-400.
   */
  inkMuted: '#9A958E',

  // ── Feedback (errors only) ──────────────────────────────────────────────
  // Success/positive uses `leaf`+`mint` and warnings use `sun` — see below —
  // so red stays reserved for things that are actually broken.
  danger: '#EF4444', // borders, dots, icons
  dangerDark: '#B91C1C', // red-700: readable red text on tinted backgrounds
  dangerBg: '#FEF2F2', // red-50: error box background
} as const;

/**
 * Font family names. Loaded in src/app/_layout.tsx via expo-font + the
 * @expo-google-fonts packages (Caprasimo = display serif for titles,
 * Outfit = geometric sans for UI/body — same pairing as the web app).
 *
 * We register one FAMILY PER WEIGHT (Outfit_600SemiBold, …) instead of one
 * family + fontWeight because React Native cannot pick a weight from a
 * runtime-loaded font: `fontWeight: '700'` next to `fontFamily: 'Outfit'`
 * silently renders regular on Android. So text styles pick the exact family
 * and do NOT set fontWeight alongside it.
 */
export const fonts = {
  display: 'Caprasimo_400Regular', // headlines, screen titles, masthead
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
  bodyExtraBold: 'Outfit_800ExtraBold',
} as const;

/** Corner radii — cards sit at 16–24px per the template's rounded look. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/** Spacing helper: spacing(4) === Tailwind's `gap-1`/`p-1` (4px). */
export const spacing = (value: number): number => value * 4;

/**
 * Order status → pill colors, following the status palette the web app uses
 * in src/components/admin/OrdersPanel.tsx: pending = sun sticker, confirmed/
 * delivered = leaf greens, shipped = sage, cancelled = red.
 * Values are pre-mixed alphas because RN has no `bg-leaf/15` utility.
 */
export const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(255, 199, 0, 0.25)', text: colors.ink },
  confirmed: { bg: colors.mint, text: colors.leafDark },
  // Sage tint like web (bg-sage/20) but ink-soft text so 12px pills stay legible.
  shipped: { bg: 'rgba(142, 155, 119, 0.20)', text: colors.inkSoft },
  delivered: { bg: 'rgba(72, 108, 73, 0.15)', text: colors.leafDark },
  cancelled: { bg: colors.dangerBg, text: colors.dangerDark },
};

/** Yellow warning wash used for toxicity notes (web: bg-sun/20 border-sun/50). */
export const warningColors = {
  bg: 'rgba(255, 199, 0, 0.20)',
  border: 'rgba(255, 199, 0, 0.50)',
} as const;
