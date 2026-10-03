import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/lib/theme';
import { format } from '@/lib/api';
import type { Product } from '@/lib/types';

/**
 * Product tile used in the shop grid. Mirrors the web ProductCard:
 * image, category badge, title, price — with a sold-out state when stock is 0.
 */
export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.imageWrap}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              alt={product.title}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>No image</Text>
            </View>
          )}
          {outOfStock ? (
            <View style={[styles.badge, styles.soldOutBadge]}>
              <Text style={[styles.badgeText, styles.soldOutText]}>Sold out</Text>
            </View>
          ) : product.category ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.category}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.price}>${format(product.price)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  imageWrap: {
    position: 'relative',
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
  imageFallbackText: {
    color: colors.gray400,
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  soldOutBadge: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray900,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray700,
    textTransform: 'capitalize',
  },
  soldOutText: {
    color: colors.white,
  },
  body: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray900,
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
  },
});
