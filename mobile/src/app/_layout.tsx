import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CartSync } from '@/components/CartSync';
import { SyncToast } from '@/components/SyncToast';
import { AuthProvider } from '@/lib/auth';

/**
 * Root layout: every screen sits inside the auth provider so any screen can
 * read the current session via useAuth(). The (tabs) group has no stack
 * header; detail screens (product, checkout, ...) keep the native header so
 * users get the platform back gesture for free.
 */
export default function RootLayout() {
  return (
    // The app is designed light-only (see userInterfaceStyle in app.json),
    // so always use the light navigation theme — even if the device is dark.
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <CartSync />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {/* After the navigator so cart-sync toasts float over every screen */}
        <SyncToast />
        <StatusBar style="dark" />
      </AuthProvider>
    </ThemeProvider>
  );
}
