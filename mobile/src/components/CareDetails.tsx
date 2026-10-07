import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, warningColors } from '@/theme/theme';
import type { CareDetails } from '@/lib/types';

interface CareDetailsProps {
  care: CareDetails;
}

/**
 * Renders one care fact for the definition list. Arrays join with commas,
 * booleans read as Yes/No, hardiness objects show "min – max". Returns
 * undefined when there's nothing to show so empty fields leave no blank row.
 */
function formatValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : undefined;
  }
  if (typeof value === 'object') {
    const range = value as { min?: string; max?: string };
    const display = [range.min, range.max].filter(Boolean).join(' – ');
    return display || undefined;
  }
  return String(value);
}

/**
 * "Care Details" — the mobile twin of the web app's CareSection
 * (src/components/ProductDetail.tsx): four headline facts (Watering, Light,
 * Care Level, Cycle) as cards, the remaining facts as a definition list, and
 * a yellow warning line when the plant is toxic to pets or humans.
 * Rendered only for products that actually carry care_details JSONB.
 */
export function CareDetails({ care }: CareDetailsProps) {
  // Icon-led headline cards; facts without a value are dropped, so a plant
  // with only two known facts simply shows two cards.
  const headline = [
    { icon: 'water-outline' as const, label: 'Watering', value: formatValue(care.watering) },
    {
      icon: 'sunny-outline' as const,
      label: 'Light',
      value: formatValue(care.sunlight),
    },
    {
      icon: 'leaf-outline' as const,
      label: 'Care Level',
      value: formatValue(care.care_level),
    },
    { icon: 'sync-outline' as const, label: 'Cycle', value: formatValue(care.cycle) },
  ].filter((fact) => fact.value !== undefined);

  // Same field order as the web component's <dl>.
  const allRows: { label: string; value: string | undefined }[] = [
    { label: 'Scientific name', value: formatValue(care.scientific_name) },
    { label: 'Other names', value: formatValue(care.other_names) },
    { label: 'Type', value: formatValue(care.type) },
    { label: 'Origin', value: formatValue(care.origin) },
    { label: 'Watering', value: formatValue(care.watering) },
    { label: 'Watering guide', value: formatValue(care.watering_benchmark) },
    { label: 'Sunlight', value: formatValue(care.sunlight) },
    { label: 'Soil', value: formatValue(care.soil) },
    { label: 'Care level', value: formatValue(care.care_level) },
    { label: 'Maintenance', value: formatValue(care.maintenance) },
    { label: 'Growth rate', value: formatValue(care.growth_rate) },
    { label: 'Hardiness', value: formatValue(care.hardiness) },
    { label: 'Flowering season', value: formatValue(care.flowering_season) },
    { label: 'Suitable indoors', value: formatValue(care.indoor) },
  ];
  const rows = allRows.filter((row) => row.value !== undefined);

  const isToxic = Boolean(care.poisonous_to_pets || care.poisonous_to_humans);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Care Details
      </Text>

      {headline.length > 0 ? (
        <View style={styles.headlineGrid}>
          {headline.map((fact) => (
            <View key={fact.label} style={styles.factCard}>
              <Ionicons
                name={fact.icon}
                size={20}
                color={colors.leaf}
                style={styles.factIcon}
              />
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {rows.length > 0 ? (
        <View>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.row, index === rows.length - 1 && styles.rowLast]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isToxic ? (
        // Yellow-tinted toxicity warning — same copy and treatment as web.
        <View style={styles.warning}>
          <Ionicons name="warning" size={16} color={colors.ink} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            {care.poisonous_to_pets ? 'Toxic to pets. ' : ''}
            {care.poisonous_to_humans ? 'Toxic if ingested by humans.' : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 24,
    marginTop: 8,
  },
  heading: {
    // Caprasimo display face, matching the web <h2> for this section.
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 14,
  },
  headlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  factCard: {
    // Two cards per row (gap included), so up to four headline facts fit
    // as a 2×2 grid on phones.
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
  },
  factIcon: {
    marginBottom: 8,
  },
  factLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.inkSoft,
  },
  factValue: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: warningColors.bg,
    borderWidth: 1,
    borderColor: warningColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    lineHeight: 20,
  },
});
