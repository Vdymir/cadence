import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IntroReveal } from '@/components/splash';
import { PrimaryButton, ThemedText } from '@/components/ui';
import { spacing } from '@/constants/theme';

export type OnboardingScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaTitle: string;
  onContinue: () => void;
  ctaDisabled?: boolean;
  /** Tertiary footnote under the content, for the honest caveats. */
  note?: string | null;
  /** Rendered under the CTA: a "Not now" text button, typically. */
  footer?: ReactNode;
  /** True when the content holds a TextInput, so the scroll view yields to the
   * keyboard the way the passage editor does. */
  keyboard?: boolean;
};

/**
 * The shape every onboarding step shares, lifted from the paywall's layout:
 * a scroll view whose content grows to fill, so the CTA pins to the bottom on
 * a tall screen and scrolls on a short one, with no KeyboardAvoidingView.
 *
 * Three reveal slots, so the CTA is reachable in about 360ms. The content and
 * CTA slots are transform-only (`fade={false}`): option cards and the button
 * contain glass, which renders empty under an animated opacity.
 */
export function OnboardingScreen({
  title,
  subtitle,
  children,
  ctaTitle,
  onContinue,
  ctaDisabled = false,
  note,
  footer,
  keyboard = false,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xxl },
      ]}
      contentInsetAdjustmentBehavior={keyboard ? 'automatic' : undefined}
      automaticallyAdjustKeyboardInsets={keyboard}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <IntroReveal order={0} autoplay>
        <ThemedText variant="largeTitle" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText variant="subheadProse" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </IntroReveal>
      <IntroReveal order={1} fade={false} autoplay>
        {children}
      </IntroReveal>
      {note ? (
        <ThemedText variant="footnoteProse" tone="tertiary" style={styles.note}>
          {note}
        </ThemedText>
      ) : null}
      <View style={styles.flexSpacer} />
      <IntroReveal order={2} fade={false} autoplay>
        <PrimaryButton title={ctaTitle} onPress={onContinue} disabled={ctaDisabled} />
        {footer}
      </IntroReveal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    marginTop: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  note: {
    marginTop: spacing.md,
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: spacing.xxxl,
  },
});
