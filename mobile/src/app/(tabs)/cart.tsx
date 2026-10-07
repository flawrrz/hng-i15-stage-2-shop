import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { calculateTotals } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { formatNaira, FREE_DELIVERY_THRESHOLD } from '@/lib/utils';
import { colors, fonts, radius } from '@/theme/theme';

/**
 * Cart: line items with quantity controls plus an order summary.
 * Totals use the same rules as the web checkout (delivery ₦3,500 — free at
 * ₦50,000+ — plus 7.5% VAT) so both apps agree on the price.
 */
export default function CartScreen() {
  const { items, hydrated, updateQuantity, removeItem, clearCart } = useCartStore();
  const [showSummary, setShowSummary] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { shipping, tax, total } = calculateTotals(subtotal);

  const confirmRemove = (productId: string, title: string) => {
    Alert.alert('Remove item', `Remove “${title}” from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
    ]);
  };

  const confirmClear = () => {
    Alert.alert('Clear cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  // Storage reads are synchronous with localStorage, but guard anyway so a
  // restored cart never flashes the empty state on launch.
  if (hydrated && items.length === 0) {
    return (
      <EmptyState
        icon="cart-outline"
        title="Your cart is empty"
        message="Browse the shop and add something you love — your items will show up here."
        actionTitle="Start Shopping"
        onAction={() => router.push('/')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
          {items.length > 0 ? (
            <Text style={styles.clear} onPress={confirmClear}>
              Clear cart
            </Text>
          ) : null}
        </View>

        {items.map((item) => (
          <View key={item.product_id} style={styles.itemCard}>
            <Image
              source={item.image_url ? { uri: item.image_url } : undefined}
              style={styles.itemImage}
              contentFit="cover"
              transition={200}
              alt={item.title}
            />
            <View style={styles.itemBody}>
              <View style={styles.itemTop}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.inkMuted}
                  onPress={() => confirmRemove(item.product_id, item.title)}
                />
              </View>
              <Text style={styles.itemPrice}>{formatNaira(item.price)}</Text>
              <View style={styles.itemBottom}>
                <QuantityStepper
                  quantity={item.quantity}
                  min={1}
                  onChange={(next) => updateQuantity(item.product_id, next)}
                />
                <Text style={styles.lineTotal}>
                  {formatNaira(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Summary is collapsed like the web cart drawer; the full breakdown
            also appears on the checkout screen. */}
        {items.length > 0 ? (
          <View style={styles.summaryCard}>
            <Text
              style={styles.summaryToggle}
              onPress={() => setShowSummary((open) => !open)}
            >
              Order summary {showSummary ? '▾' : '▸'}
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
            </View>

            {showSummary ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>
                    {shipping === 0 ? 'Free' : formatNaira(shipping)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimated Tax (7.5%)</Text>
                  <Text style={styles.summaryValue}>{formatNaira(tax)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatNaira(total)}</Text>
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {items.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalValue}>{formatNaira(total)}</Text>
          </View>
          <Button
            title="Proceed to Checkout"
            onPress={() => router.push('/checkout')}
          />
          {subtotal < FREE_DELIVERY_THRESHOLD ? (
            <Text style={styles.shippingNote}>
              Add {formatNaira(FREE_DELIVERY_THRESHOLD - subtotal)} more for free
              delivery
            </Text>
          ) : (
            <Text style={styles.shippingNote}>✓ You&apos;ve unlocked free delivery</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    // Screen heading → Caprasimo.
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  clear: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.dangerDark,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  itemBody: {
    flex: 1,
    marginLeft: 12,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    marginTop: 2,
    marginBottom: 10,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineTotal: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 4,
  },
  summaryToggle: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.inkSoft,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 6,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    padding: 16,
    paddingBottom: 20,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: colors.inkSoft,
  },
  footerTotalValue: {
    fontSize: 18,
    fontFamily: fonts.bodyExtraBold,
    color: colors.ink,
  },
  shippingNote: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
