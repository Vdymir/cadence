import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding';
import { ThemedText } from '@/components/ui';
import { radius, spacing, type } from '@/constants/theme';
import { useMarkInteractive } from '@/hooks/use-mark-interactive';
import { useSetting } from '@/hooks/use-settings';
import { useTheme } from '@/hooks/use-theme';

const MAX_NAME = 24;

/**
 * Step 1: the name the Home greeting uses. Optional; empty is a valid answer.
 * Prefilled from Clerk, which Apple (first authorization only) and Google both
 * supply, so most people confirm rather than type.
 */
export default function NameStep() {
  useMarkInteractive();
  const { colors } = useTheme();
  const { user } = useUser();
  const [stored, setStored] = useSetting('displayName');
  const [name, setName] = useState(stored || user?.firstName?.trim() || '');
  const [writeFailed, setWriteFailed] = useState(false);

  const next = () => {
    const trimmed = name.trim();
    const ok = trimmed === stored ? true : setStored(trimmed);
    setWriteFailed(!ok);
    // A lost write is not worth trapping someone on step 1. Settings can retry.
    router.push('/(onboarding)/accent');
  };

  return (
    <OnboardingScreen
      title="What should we call you?"
      subtitle="Clarity uses your name to greet you on the home screen. Nothing else."
      ctaTitle="Continue"
      onContinue={next}
      note={writeFailed ? 'That name could not be saved right now. You can set it in Settings later.' : null}>
      {/* Glass is chrome, solid cards are content: the same flat card the
          passage editor and Settings use. */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText variant="footnote" tone="secondary">
          Your name
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor={colors.secondary}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          maxLength={MAX_NAME}
          returnKeyType="next"
          onSubmitEditing={next}
          style={[styles.input, { color: colors.foreground }]}
        />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  input: {
    ...type.title3,
    paddingVertical: spacing.xxs,
  },
});
