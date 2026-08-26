import { ClerkProvider, useAuth } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { Observe, ObserveErrorBoundary, ObserveRoot } from 'expo-observe';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthBridge } from '@/components/auth-bridge';
import { ProgressiveBlur } from '@/components/glass-tabs';
import { ObserveErrorFallback } from '@/components/observe-error-fallback';
import { IntroRevealProvider, SplashOverlay } from '@/components/splash';
import { fontAssets, fonts, type ColorSchemeName } from '@/constants/theme';
import { useIntroReveal } from '@/hooks/use-intro-reveal';
import { AppReadyProvider } from '@/hooks/use-mark-interactive';
import { useSettings } from '@/hooks/use-settings';
import { SubscriptionProvider } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { getLastSignedInUserId } from '@/services/auth-state';

/**
 * EAS Observe. The expo-router integration adds per-route navigation metrics
 * (cold_ttr, warm_ttr, and a per-navigation tti tagged with the route pattern)
 * on top of the app-wide startup metrics. It must be configured at module
 * scope: the library throws if the integration is toggled after the tree
 * mounts, and this module is evaluated before any screen renders.
 *
 * Metrics from debug builds are dropped by default, so a local dev build sends
 * nothing. EXPO_PUBLIC_OBSERVE_IN_DEV=1 dispatches them anyway while verifying
 * the wiring; it has no effect on release builds.
 */
Observe.configure({
  integrations: { 'expo-router': true },
  dispatchInDebug: process.env.EXPO_PUBLIC_OBSERVE_IN_DEV === '1',
});

/**
 * Read in app code and passed explicitly: Metro inlines EXPO_PUBLIC_ variables
 * here but not inside node_modules. Deliberately NOT asserted at module scope.
 * `ClerkProvider` throws during render when the key is missing, and a render
 * throw is what `ObserveErrorBoundary` below can catch and report; a module
 * scope throw happens before any boundary exists.
 */
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** The QA seed route is compiled to a refusal unless the simulator build profile
 * sets this, and now it is also removed from the navigator in every other build. */
const SEED_ENABLED = process.env.EXPO_PUBLIC_SEED_HOOKS === '1';

// Single source of truth for the native route background. The navigator paints
// every screen's container with the navigation theme's `background`, so setting
// it here themes all nested navigators at once and paints the screen container
// before JS content mounts — the surface behind the tab-switch fade always
// matches the screen color, so no flash.
function NavThemeProvider({ children }: { children: ReactNode }) {
  const { colors, scheme } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.foreground,
    },
    // Navigator-rendered text (headers, back labels) uses SF Pro Rounded too.
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: '400' },
      medium: { fontFamily: fonts.medium, fontWeight: '500' },
      bold: { fontFamily: fonts.semibold, fontWeight: '600' },
      heavy: { fontFamily: fonts.bold, fontWeight: '700' },
    },
  } as const;

  // Keep the native root view / window (behind the routes: launch, overscroll
  // bounce, transparent sheets) in sync with the theme too.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return <ThemeProvider value={navTheme}>{children}</ThemeProvider>;
}

/**
 * The root navigator and its three-way gate: signed out, signed in but not
 * onboarded, and fully onboarded.
 *
 * The gate is SYNCHRONOUS. On the first frame Clerk has not loaded, so
 * `signedIn` comes from the flag the auth bridge keeps in MMKV. That is what
 * lets a returning user land on their tabs offline, exactly as they did before
 * accounts existed; Clerk then confirms or revokes and the guard follows.
 *
 * Declaration order matters. When a guard removes the group that owns the
 * current route, expo-router falls back to the first available screen, and
 * signed out that must be sign-in. Guard flips also drop the removed group's
 * history, which is why sign-out needs no `router.replace` anywhere.
 */
function RootNavigator({ scheme }: { scheme: ColorSchemeName }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { onboardingCompletedAt } = useSettings();
  const signedIn = isLoaded ? isSignedIn === true : getLastSignedInUserId() !== null;
  const onboarded = onboardingCompletedAt != null;

  const blurHeader = {
    title: '',
    headerTransparent: true,
    headerShadowVisible: false,
    headerBlurEffect: 'none',
    headerBackground: () => <ProgressiveBlur direction="top" tint={scheme} style={{ flex: 1 }} />,
  } as const;

  return (
    <Stack>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* A one-way corridor at the root: no swipe back toward sign-in. Movement
          between steps is the nested stack's business. */}
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen
          name="(onboarding)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Protected>

      {/* Every existing screen, modals included: a signed-out deep link to
          /settings or /paywall must not resolve. */}
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session"
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
        {/* Keeps its native header: a custom left-placed title and the close
            button live in the stack toolbar (Stack.Toolbar inside the route).
            The shared progressive blur lets the form scroll beneath the toolbar
            without introducing a hard material edge. */}
        <Stack.Screen name="passage-editor" options={{ presentation: 'modal', ...blurHeader }} />
        {/* Same native-header treatment as the passage editor. */}
        <Stack.Screen name="settings" options={{ presentation: 'modal', ...blurHeader }} />
        {/* Both draw their own close button and their own scrolling (the
            paywall is ours, the Customer Center is a RevenueCat-hosted native
            view), so they take the whole modal with no header of ours on top. */}
        <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="manage-subscription"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack.Protected>

      {/* Was undeclared, and therefore auto-added and reachable in every build.
          QA deep-links to it before signing in, so it sits outside the auth
          guards; the flag removes it from the tree everywhere else. */}
      <Stack.Protected guard={SEED_ENABLED}>
        <Stack.Screen name="dev-seed" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  // Expo Go can't embed fonts at build time, so load them here. The splash
  // overlay needs no fonts, so it plays over the wait — only the routes
  // beneath it hold for the font load.
  const [fontsReady, fontError] = useFonts(fontAssets);
  const { scheme } = useTheme();
  // revealed flips when the splash logo ends (content starts staggering in
  // beneath the fade); splashDone flips when the fade completes (overlay unmounts).
  const { revealed, setRevealed, splashDone, setSplashDone } = useIntroReveal();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* A render error anywhere below here used to take the app down with
          nothing recorded: React never routes render errors through the
          `ErrorUtils` handler that already reports every other unhandled JS
          error to Observe. Outside the providers so a throw in one of them is
          caught too, and outside the font gate so the fallback can render
          before the fonts land. */}
      <ObserveErrorBoundary fallback={ObserveErrorFallback}>
        {/* Identity. Above the routes so the gate can read it, and outside the
            font gate so the keychain read and environment fetch overlap the
            font load instead of following it. `tokenCache` keeps the session
            across relaunches; `resourceCache` lets Clerk resolve it offline. */}
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
          __experimental_resourceCache={resourceCache}>
          <AuthBridge />
          {/* Configures RevenueCat and holds the Clarity Pro entitlement for
              every screen. Above the routes so the first render of any screen
              can already branch on it, and outside the font gate so the SDK
              starts its first customer-info read while the fonts load. */}
          <SubscriptionProvider>
            {/* Observe's TTI is reported by each screen, but only once the
                splash overlay is gone: until then it covers the routes and eats
                every touch, so the app is not interactive no matter what has
                rendered. */}
            <AppReadyProvider value={splashDone}>
              <IntroRevealProvider value={revealed}>
                <NavThemeProvider>
                  {fontsReady || fontError ? <RootNavigator scheme={scheme} /> : null}
                  {/* The splash backdrop inverts the scheme (light mode plays on
                      black), so pin the status bar to stay legible until it's gone. */}
                  <StatusBar style={splashDone ? 'auto' : scheme} />
                  {!splashDone ? (
                    <SplashOverlay
                      onReveal={() => setRevealed(true)}
                      onDone={() => setSplashDone(true)}
                    />
                  ) : null}
                </NavThemeProvider>
              </IntroRevealProvider>
            </AppReadyProvider>
          </SubscriptionProvider>
        </ClerkProvider>
      </ObserveErrorBoundary>
    </GestureHandlerRootView>
  );
}

// Measures Time to First Render (cold_ttr / warm_ttr) and hosts the router
// integration that tags every later metric with its route.
export default ObserveRoot.wrap(RootLayout);
