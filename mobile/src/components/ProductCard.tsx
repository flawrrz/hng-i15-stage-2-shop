import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/theme';
import { formatNaira } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

/**
 * Product tile used in the shop grid. Mirrors the web ProductCard:
 * Caprasimo title + naira price above a rounded photo, a yellow sticker
 * badge for the category, and a sold-out state when stock is 0.
 */
export function ProductCard({ product }: ProductCardProps) {
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
            // Sun-yellow sticker badge — the template's playful accent.
            <View style={[styles.badge, styles.stickerBadge]}>
              <Text style={[styles.badgeText, styles.stickerText]}>
                {product.category}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.price}>{formatNaira(product.price)}</Text>
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
    borderColor: colors.line,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: colors.surface,
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
    color: colors.inkMuted,
    fontSize: 13,
    fontFamily: fonts.body,
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
    borderColor: colors.line,
  },
  stickerBadge: {
    backgroundColor: colors.sun,
    borderColor: colors.sun,
  },
  soldOutBadge: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  stickerText: {
    color: colors.ink,
  },
  soldOutText: {
    color: colors.white,
  },
  body: {
    padding: 12,
  },
  title: {
    // Caprasimo — web's ProductCard titles the product name with font-display.
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
});
