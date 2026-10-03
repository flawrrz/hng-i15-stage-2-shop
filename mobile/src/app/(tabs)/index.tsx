import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { colors, radius } from '@/lib/theme';
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

  const query = search.trim().toLowerCase();
  const filtered = query
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.description ?? '').toLowerCase().includes(query) ||
          (p.category ?? '').toLowerCase().includes(query)
      )
    : products;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={styles.centerText}>Loading products…</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.gray400} />
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
          {/* Hero — same copy as the web home page */}
          <View style={styles.hero}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>New Collection Now Available</Text>
            </View>
            <Text style={styles.heroTitle}>Discover Products You&apos;ll Love</Text>
            <Text style={styles.heroSubtitle}>
              Handpicked essentials designed to make your everyday extraordinary.
            </Text>
            <Button
              title="Shop Now"
              variant="outline"
              fullWidth={false}
              onPress={() => setSearch('')}
              style={styles.heroButton}
            />
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.gray400} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products…"
              placeholderTextColor={colors.gray400}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.gray400}
                onPress={() => setSearch('')}
              />
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            {query ? `Results for “${search.trim()}”` : 'All Products'}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyResults}>
          <Ionicons name="search-outline" size={36} color={colors.gray400} />
          <Text style={styles.errorTitle}>No products found</Text>
          <Text style={styles.centerText}>Try a different search term.</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <View style={styles.newsletterCard}>
            <Text style={styles.newsletterTitle}>Stay in the loop</Text>
            <Text style={styles.newsletterText}>
              Subscribe for exclusive offers, new arrivals and style inspiration.
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
    backgroundColor: colors.gray50,
  },
  centerText: {
    marginTop: 8,
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
  },
  retry: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.gray50,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
  cardWrap: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.gray900,
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  heroChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  heroChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: colors.gray400,
    fontSize: 15,
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
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray900,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
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
    backgroundColor: colors.gray900,
    borderRadius: radius.xl,
    padding: 24,
  },
  newsletterTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  newsletterText: {
    color: colors.gray400,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
