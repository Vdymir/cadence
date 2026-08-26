import { AppleIcon, GoogleIcon } from '@hugeicons-pro/core-solid-rounded';
import { useSignIn } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignInWithGoogle } from '@clerk/expo/google';
import Constants from 'expo-constants';
import { Observe } from 'expo-observe';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IntroReveal } from '@/components/splash';
import { PrimaryButton, ThemedText } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useMarkInteractive } from '@/hooks/use-mark-interactive';
import { useTheme } from '@/hooks/use-theme';

/**
 * A password account on the Clerk DEVELOPMENT instance, for exercising the
 * signed-in app on a simulator, where neither native sheet can complete
 * (Apple needs a signed-in Apple ID, Google needs the OAuth client wiring).
 * The password strategy stays on for the dev instance only.
 *
 * The credential is read from `.env.local`, which is not committed, and never
 * written in source: a password in the repo is a password in every clone and
 * in every bundle built from one. Unset either variable and the dev button
 * does not render, so a checkout without them has no password path at all.
 * The `__DEV__` guard is what keeps the inlined values out of release bundles.
 */
function devAccountFromEnv(): { emailAddress: string; password: string } | null {
  const emailAddress = process.env.EXPO_PUBLIC_DEV_SIGNIN_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_SIGNIN_PASSWORD?.trim();
  if (!emailAddress || !password) return null;
  return { emailAddress, password };
}

const DEV_ACCOUNT = __DEV__ ? devAccountFromEnv() : null;

/** Cancelling a native sheet is not an error and gets no error UI. */
const CANCEL_CODES = new Set(['ERR_REQUEST_CANCELED', 'SIGN_IN_CANCELLED', '-5']);

function isCancel(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' || typeof code === 'number'
    ? CANCEL_CODES.has(String(code))
    : false;
}

function trimmedExtra(key: string): string | null {
  const value = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Whether the build can present the Google sheet at all.
 *
 * The Google SDK raises an Objective-C exception, not a JS error, when
 * Info.plist carries no URL scheme for the client ID it was configured with
 * ("missing support for the following URL schemes", GIDSignIn.m). That aborts
 * the process, so the try/catch in `run` never sees it and a build with
 * mismatched credentials crashes on tap instead of showing a message.
 *
 * Both values ship in `extra` (see app.config.ts), so comparing them here
 * turns that crash back into the same failure text every other error gets.
 * The scheme is the client ID's dot-separated parts reversed and lowercased,
 * which is what GIDSignInCallbackSchemes derives. The client ID falls back to
 * the web one because the native module does the same when the iOS one is
 * unset.
 */
function googleIsMisconfigured(): boolean {
  if (Platform.OS !== 'ios') return false;
  const clientId =
    trimmedExtra('EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID') ??
    trimmedExtra('EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID');
  const scheme = trimmedExtra('EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME');
  if (!clientId || !scheme) return true;
  return scheme.toLowerCase() !== clientId.split('.').reverse().join('.').toLowerCase();
}

/** Read once: neither value can change after the build. */
const GOOGLE_MISCONFIGURED = googleIsMisconfigured();

/**
 * The signed-out screen: a gradient and two native sign-in buttons.
 *
 * Both hooks return `{ createdSessionId, setActive }` and need `setActive`
 * called. That is the documented shape for the native hooks; the `finalize()`
 * pattern belongs to Clerk's custom form flows and does not apply here. Both
 * also handle sign-in-or-sign-up internally, so one screen covers new and
 * returning users.
 *
 * No navigation on success. The root navigator's guard reads the new session
 * and swaps this group out on its own.
 */
export default function SignInScreen() {
  useMarkInteractive();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { signIn } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = async (
    provider: 'apple' | 'google',
    start: () => Promise<{
      createdSessionId: string | null;
      setActive?: (params: { session: string }) => Promise<unknown>;
    }>,
  ) => {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const { createdSessionId, setActive } = await start();
      if (createdSessionId && setActive) await setActive({ session: createdSessionId });
    } catch (error) {
      if (!isCancel(error)) {
        Observe.reportError(error);
        // Observe keeps the report; the console is where a developer on a
        // device build actually reads it. Compiled out of release.
        if (__DEV__) console.warn(`[auth] ${provider} sign-in failed`, error);
        setFailure(`Could not sign in with ${provider === 'apple' ? 'Apple' : 'Google'}. Try again.`);
      }
    } finally {
      setBusy(false);
    }
  };

  /**
   * Only reachable from a build whose Google credentials disagree, which is a
   * packaging mistake rather than anything the person tapping can fix. The
   * message says what they can do next and nothing about why; the identifiers
   * go to Observe, where they belong. The guard only fires on iOS, so the
   * Apple button is always on screen beside it.
   */
  const onGoogle = () => {
    if (GOOGLE_MISCONFIGURED) {
      Observe.reportError(
        new Error('Google sign-in URL scheme does not match the configured client ID'),
      );
      if (__DEV__) {
        console.warn(
          '[auth] google sign-in is misconfigured: Info.plist carries no URL scheme for the ' +
            'configured client ID. Check EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID against ' +
            'EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME.',
        );
      }
      setFailure('Google sign-in is unavailable right now. Please continue with Apple.');
      return;
    }
    run('google', startGoogleAuthenticationFlow);
  };

  /**
   * The custom-flow shape, unlike the native hooks: `password()` then
   * `finalize()`, each returning `{ error }` rather than throwing.
   */
  const runDev = async () => {
    if (!DEV_ACCOUNT || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const { error } = await signIn.password(DEV_ACCOUNT);
      if (error) throw error;
      if (signIn.status !== 'complete') throw new Error(`Sign-in status ${signIn.status}`);
      const finalized = await signIn.finalize();
      if (finalized.error) throw finalized.error;
    } catch (error) {
      Observe.reportError(error);
      // Dev-only path, so the console is the right place for the detail.
      console.warn('[auth] dev sign-in failed', error);
      setFailure('Dev sign-in failed. Check the Metro console.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Placeholder artwork. Same technique as passage-carousel.tsx and
          progressive-blur.tsx: a CSS gradient with no gradient package. The
          stops are theme tokens so it follows the scheme. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            experimental_backgroundImage: `linear-gradient(to bottom, ${colors.accentBg} 0%, ${colors.background} 70%)`,
          },
        ]}
      />
      <View style={{ flex: 1 }} />
      <View
        style={[
          styles.actions,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}>
        {failure ? (
          <ThemedText variant="footnote" tone="secondary" style={styles.failure}>
            {failure}
          </ThemedText>
        ) : null}
        {/* fade={false}: PrimaryButton renders a GlassView, which goes blank
            under an animated opacity. autoplay: this screen mounts after the
            splash, so the reveal must replay rather than skip. */}
        {Platform.OS === 'ios' ? (
          <IntroReveal order={0} fade={false} autoplay>
            <PrimaryButton
              title="Continue with Apple"
              icon={AppleIcon}
              disabled={busy}
              onPress={() => run('apple', startAppleAuthenticationFlow)}
            />
          </IntroReveal>
        ) : null}
        <IntroReveal order={1} fade={false} autoplay>
          <PrimaryButton
            title="Continue with Google"
            icon={GoogleIcon}
            disabled={busy}
            onPress={onGoogle}
          />
        </IntroReveal>
        {DEV_ACCOUNT ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={runDev}
            style={({ pressed }) => [styles.textButton, { opacity: pressed || busy ? 0.6 : 1 }]}>
            <ThemedText variant="subhead" tone="tertiary">
              Sign in as dev (development build only)
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  failure: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  textButton: {
    alignSelf: 'center',
    padding: spacing.md,
  },
});
