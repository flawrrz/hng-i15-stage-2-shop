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
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { format } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';
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
        <ActivityIndicator size="large" color={colors.black} />
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
              <Ionicons name="image-outline" size={48} color={colors.gray300} />
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
          <Text style={styles.price}>${format(product.price)}</Text>

          {/* Stock badge — mirrors the web product page messaging */}
          <View style={styles.stockRow}>
            {outOfStock ? (
              <>
                <View style={[styles.stockDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.stockText, { color: colors.danger }]}>
                  Out of stock
                </Text>
              </>
            ) : product.stock_quantity <= 5 ? (
              <>
                <View style={[styles.stockDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.stockText, { color: '#b45309' }]}>
                  Only {product.stock_quantity} left
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.stockDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.stockText, { color: '#047857' }]}>In stock</Text>
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
        </View>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>
            ${format(product.price * quantity)}
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
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray100,
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
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
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
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.gray600,
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
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
    color: colors.gray500,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
  },
  addButton: {
    flex: 1.4,
  },
});
