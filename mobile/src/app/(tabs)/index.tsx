import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { NewsletterForm } from '@/components/NewsletterForm';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/theme';
import type { Product } from '@/lib/types';

/**
 * Shop home: hero banner, search and a 2-column product grid.
 * Products load client-side from Supabase (the web app does this on the
 * server; on mobile there is no server, so we query with the anon key and
 * rely on the same Row Level Security policies).
 */
export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // Promise chain rather than async/await: react-hooks' set-state-in-effect
  // rule requires state updates to live in async callbacks (like the fetching
  // examples on react.dev), not in the function called directly by the effect.
  const load = useCallback(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch((loadError) => {
        console.error('Failed to load products:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Something went wrong');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  // Kicks off the first load; RefreshControl re-runs it on pull-to-refresh.
  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // Categories present in the catalog — the same data-derived chip list the
  // web /products page builds. Mobile has no URL params, so the filter lives
  // in component state instead of the address bar.
  const categories = [
    ...new Set(
      products.map((p) => p.category).filter((c): c is string => Boolean(c))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const query = search.trim().toLowerCase();
  // Search and category compose: both must match for a card to show.
  const filtered = products.filter((p) => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query) ||
      (p.description ?? '').toLowerCase().includes(query) ||
      (p.category ?? '').toLowerCase().includes(query);
    const matchesCategory = !category || (p.category ?? '') === category;
    return matchesQuery && matchesCategory;
  });

  // Heading reflects what's actually being shown.
  const titleParts: string[] = [];
  if (query) titleParts.push(`Results for “${search.trim()}”`);
  if (category) titleParts.push(category);
  const sectionTitle =
    titleParts.length > 0 ? titleParts.join(' in ') : 'All Products';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.leaf} />
        <Text style={styles.centerText}>Loading products…</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.inkMuted} />
        <Text style={styles.errorTitle}>Couldn&apos;t load the shop</Text>
        <Text style={styles.centerText}>{error}</Text>
        <Button title="Retry" onPress={load} fullWidth={false} style={styles.retry} />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {/* Hero — the gazette masthead, same brand voice as the web home */}
          <View style={styles.hero}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>In This Issue</Text>
            </View>
            <Text style={styles.heroTitle}>The Green Gazette™</Text>
            <Text style={styles.heroSubtitle}>
              Handpicked plants from the greenhouse — delivered across Lagos and
              Nigeria, each with its own care notes.
            </Text>
            <Button
              title="Shop the Catalogue"
              variant="outline"
              fullWidth={false}
              onPress={() => setSearch('')}
              style={styles.heroButton}
            />
          </View>

          {/* Category chips — mirrors the web /products filter chips */}
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => setCategory(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: category === null }}
              style={({ pressed }) => [
                styles.chip,
                category === null && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[styles.chipText, category === null && styles.chipTextActive]}
              >
                All
              </Text>
            </Pressable>
            {categories.map((chip) => {
              const isActive = chip === category;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setCategory(isActive ? null : chip)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.inkMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search plants…"
              placeholderTextColor={colors.inkMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.inkMuted}
                onPress={() => setSearch('')}
              />
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyResults}>
          <Ionicons name="search-outline" size={36} color={colors.inkMuted} />
          <Text style={styles.errorTitle}>
            {category && !query ? `Nothing in ${category} yet` : 'No products found'}
          </Text>
          <Text style={styles.centerText}>
            {query
              ? 'Try a different search term.'
              : 'Check back soon — new items land every week.'}
          </Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <View style={styles.newsletterCard}>
            <Text style={styles.newsletterTitle}>Join the Gazette</Text>
            <Text style={styles.newsletterText}>
              Plant care notes, new arrivals and subscribers-only offers — one
              letter, twice a month.
            </Text>
            <NewsletterForm />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ProductCard product={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.surface,
  },
  centerText: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 12,
    // Screen headline → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  retry: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
  cardWrap: {
    flex: 1,
  },
  hero: {
    // Dark banner = ink, per the design system.
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroChip: {
    alignSelf: 'flex-start',
    // Yellow sticker badge — the template's playful accent.
    backgroundColor: colors.sun,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  heroChipText: {
    color: colors.ink,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    // Masthead: Caprasimo display face (no fontWeight — it's single-weight).
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: colors.leafSoft,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.ink,
    paddingVertical: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipActive: {
    // Active chip = leaf green, like the web /products filter chips.
    backgroundColor: colors.leaf,
    borderColor: colors.leaf,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    // Screen section heading → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 14,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footer: {
    marginTop: 12,
  },
  newsletterCard: {
    // Newsletter block sits on the ink banner, same as the web footer CTA.
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: 24,
  },
  newsletterTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginBottom: 6,
  },
  newsletterText: {
    color: colors.leafSoft,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    marginBottom: 16,
  },
});
