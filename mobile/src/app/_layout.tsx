import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CartSync } from '@/components/CartSync';
import { SyncToast } from '@/components/SyncToast';
import { AuthProvider } from '@/lib/auth';
import { colors, fonts } from '@/theme/theme';

// Keep the native splash (colored ink in app.json) on screen until the
// Green Gazette fonts are ready — otherwise every screen flashes the system
// font first. Must run at module scope (not inside the component) so it
// happens before React even mounts. On web this is a no-op.
SplashScreen.preventAutoHideAsync();

/**
 * Root layout: every screen sits inside the auth provider so any screen can
 * read the current session via useAuth(). The (tabs) group has no stack
 * header; detail screens (product, checkout, ...) keep the native header so
 * users get the platform back gesture for free.
 */
export default function RootLayout() {
  // Fonts are loaded here (not per screen) so the whole app renders with
  // Caprasimo/Outfit from the first frame. The family names must match the
  // `fonts` map in @/theme/theme — that's where styles reference them.
  const [fontsLoaded, fontError] = useFonts({
    [fonts.display]: Caprasimo_400Regular,
    [fonts.body]: Outfit_400Regular,
    [fonts.bodyMedium]: Outfit_500Medium,
    [fonts.bodySemiBold]: Outfit_600SemiBold,
    [fonts.bodyBold]: Outfit_700Bold,
    [fonts.bodyExtraBold]: Outfit_800ExtraBold,
  });

  // A font can fail (corrupt cache, offline first launch). Log it and render
  // anyway with the system font — hanging forever on the splash would be worse.
  if (fontError) {
    console.error('Fonts failed to load; falling back to system fonts:', fontError);
  }

  // Not ready yet → render nothing so the native splash stays visible.
  // The AnimatedSplashOverlay below hides it (and plays its fade) once mounted.
  if (!fontsLoaded && !fontError) return null;

  return (
    // The app is designed light-only (see userInterfaceStyle in app.json),
    // so always use the light navigation theme — even if the device is dark.
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <CartSync />
        <Stack
          // Native header styling: Caprasimo titles + ink back affordance so
          // headers match the web app's gazette masthead typography.
          screenOptions={{
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.display, color: colors.ink },
            headerStyle: { backgroundColor: colors.white },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {/* After the navigator so cart-sync toasts float over every screen */}
        <SyncToast />
        <StatusBar style="dark" />
      </AuthProvider>
    </ThemeProvider>
  );
}
