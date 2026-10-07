import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CareDetails } from '@/components/CareDetails';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import { formatNaira } from '@/lib/utils';
import { colors, fonts, radius } from '@/theme/theme';
import type { Product } from '@/lib/types';

/**
 * Product detail: large image, description, stock info and add-to-cart.
 * Route: /product/[id] — pushed on top of the tab bar so the back gesture
 * returns to wherever the user came from.
 */
export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          console.error('Failed to load product:', fetchError);
          setError('This product could not be found.');
        } else {
          setProduct(data as Product);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const outOfStock = (product?.stock_quantity ?? 0) <= 0;

  const handleAddToCart = () => {
    if (!product) return;

    // The store's addItem adds one per call, so repeat `quantity` times to
    // honor the chosen quantity (and increment if it's already in the cart).
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        product_id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
      });
    }

    Alert.alert('Added to cart', `${product.title} × ${quantity}`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'Go to Cart', onPress: () => router.push('/cart') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.leaf} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Product not found"
        message={error ?? 'This item may have been removed.'}
        actionTitle="Back to Shop"
        onAction={() => router.push('/')}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: product.category ?? 'Product' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrap}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={250}
              alt={product.title}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="image-outline" size={48} color={colors.leafSoft} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          {product.category ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{product.title}</Text>
          {/* Scientific name sits under the title in italic, like the web page */}
          {product.care_details?.scientific_name ? (
            <Text style={styles.scientificName}>
              {product.care_details.scientific_name}
            </Text>
          ) : null}
          <Text style={styles.price}>{formatNaira(product.price)}</Text>

          {/* Stock badge — mirrors the web product page messaging */}
          <View style={styles.stockRow}>
            {outOfStock ? (
              <>
                <View style={[styles.stockDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.stockText, { color: colors.dangerDark }]}>
                  Out of stock
                </Text>
              </>
            ) : product.stock_quantity <= 5 ? (
              <>
                {/* Sun-yellow = low stock, the design system's warning color */}
                <View style={[styles.stockDot, { backgroundColor: colors.sun }]} />
                <Text style={[styles.stockText, { color: colors.ink }]}>
                  Only {product.stock_quantity} left
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.stockDot, { backgroundColor: colors.leaf }]} />
                <Text style={[styles.stockText, { color: colors.leaf }]}>In stock</Text>
              </>
            )}
          </View>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          <Text style={styles.quantityLabel}>Quantity</Text>
          <QuantityStepper
            quantity={quantity}
            max={Math.max(1, Math.min(product.stock_quantity, 99))}
            onChange={setQuantity}
          />

          {/* Plant care facts — only rendered when the row carries
              care_details (older products don't have the column filled). */}
          {product.care_details ? (
            <CareDetails care={product.care_details} />
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>
            {formatNaira(product.price * quantity)}
          </Text>
        </View>
        <Button
          title={outOfStock ? 'Out of Stock' : 'Add to Cart'}
          onPress={handleAddToCart}
          disabled={outOfStock}
          style={styles.addButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.mint,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mint,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.leafDark,
    textTransform: 'capitalize',
  },
  title: {
    // Product name → Caprasimo display face (web: font-display).
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontStyle: 'italic',
    color: colors.inkSoft,
    marginBottom: 6,
  },
  price: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  description: {
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 23,
    color: colors.inkSoft,
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.inkSoft,
  },
  footerTotalValue: {
    fontSize: 20,
    fontFamily: fonts.bodyExtraBold,
    color: colors.ink,
  },
  addButton: {
    flex: 1.4,
  },
});
