import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useCartStore } from '@/lib/cart-store';
import { colors, fonts } from '@/theme/theme';

/**
 * Bottom tab bar: Shop, Cart, Account.
 * The Cart tab shows a badge with the total number of items.
 *
 * Colors follow the Green Gazette palette: white bar, soft mint pill behind
 * the selected tab, leaf-green tint on the active icon/label (the web app's
 * accent color), Outfit for labels.
 */
export default function TabsLayout() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <NativeTabs
      backgroundColor={colors.white}
      indicatorColor={colors.mint}
      tintColor={colors.leaf}
      labelStyle={{
        default: { fontFamily: fonts.bodySemiBold, color: colors.inkSoft },
        selected: { fontFamily: fonts.bodySemiBold, color: colors.ink },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="storefront" sf="storefront" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="shopping_cart" sf="cart" />
        {itemCount > 0 ? (
          <NativeTabs.Trigger.Badge>{String(itemCount)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" sf="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
