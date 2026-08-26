import { Mic01Icon, Shield01Icon, VoiceIcon } from '@hugeicons-pro/core-stroke-rounded';
import { Tick02Icon } from '@hugeicons-pro/core-stroke-rounded';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding';
import { ThemedText } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useMarkInteractive } from '@/hooks/use-mark-interactive';
import { useSetting } from '@/hooks/use-settings';
import { useTheme } from '@/hooks/use-theme';

type PermissionState = 'checking' | 'undetermined' | 'granted' | 'blocked' | 'restricted';

const ROWS: { icon: IconSvgElement; text: string }[] = [
  { icon: Mic01Icon, text: 'Microphone, so Clarity can hear you read.' },
  { icon: VoiceIcon, text: 'Speech recognition, so it can follow the words and score them.' },
  { icon: Shield01Icon, text: 'Your recording is sent to a speech service to be scored.' },
];

/**
 * Step 5: the permission primer. Our screen explains; the system dialogs ask.
 *
 * Uses the COMBINED request, the same call the practice engine makes at session
 * start, so onboarding cannot grant a narrower set than the engine needs. iOS
 * shows two dialogs back to back; the copy says so.
 *
 * Completing onboarding never depends on a grant. A denial swaps the button to
 * Settings and leaves "Continue without it" underneath; the engine already
 * handles a refusal at first practice.
 */
export default function MicrophoneStep() {
  useMarkInteractive();
  const { colors } = useTheme();
  const [, setCompletedAt] = useSetting('onboardingCompletedAt');
  const [state, setState] = useState<PermissionState>('checking');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
        const current = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (alive) setState(classify(current));
      } catch {
        if (alive) setState('undetermined');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const finish = () => setCompletedAt(Date.now());

  const request = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      const next = classify(result);
      setState(next);
      if (next === 'granted') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (next === 'blocked') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      setState('undetermined');
    }
  };

  const cta =
    state === 'granted'
      ? { title: 'Start practicing', action: finish }
      : state === 'blocked'
        ? { title: 'Open Settings', action: () => Linking.openSettings() }
        : state === 'restricted'
          ? { title: 'Continue', action: finish }
          : { title: 'Allow microphone access', action: request };

  const note = !available
    ? 'Speech recognition is not available on this device. Simulators usually lack it. Try a physical device.'
    : state === 'blocked'
      ? 'Clarity cannot score a reading without the microphone. Turn it on in Settings whenever you are ready.'
      : state === 'restricted'
        ? 'Speech recognition is turned off by a restriction on this device. A parent or an administrator controls it.'
        : null;

  const footer =
    state === 'undetermined' || state === 'blocked' ? (
      <Pressable
        accessibilityRole="button"
        onPress={finish}
        style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.6 : 1 }]}>
        <ThemedText variant="subhead" tone="secondary">
          {state === 'blocked' ? 'Continue without it' : 'Not now'}
        </ThemedText>
      </Pressable>
    ) : null;

  return (
    <OnboardingScreen
      title="Clarity needs to hear you"
      subtitle="Your device will ask for each permission in its own dialog."
      ctaTitle={cta.title}
      onContinue={cta.action}
      ctaDisabled={state === 'checking'}
      note={note}
      footer={footer}>
      <View style={styles.rows}>
        {ROWS.map((row) => (
          <View key={row.text} style={styles.row}>
            <HugeiconsIcon icon={row.icon} size={24} color={colors.secondary} />
            <ThemedText variant="bodyProse" tone="secondary" style={styles.rowText}>
              {row.text}
            </ThemedText>
          </View>
        ))}
        {state === 'granted' ? (
          <View style={styles.row}>
            <HugeiconsIcon icon={Tick02Icon} size={24} color={colors.accent} />
            <ThemedText variant="bodyProse" style={styles.rowText}>
              Microphone and speech recognition are on.
            </ThemedText>
          </View>
        ) : null}
      </View>
    </OnboardingScreen>
  );
}

function classify(response: {
  granted: boolean;
  canAskAgain: boolean;
  restricted?: boolean;
}): PermissionState {
  if (response.granted) return 'granted';
  if (response.restricted) return 'restricted';
  return response.canAskAgain ? 'undetermined' : 'blocked';
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  textButton: {
    alignSelf: 'center',
    padding: spacing.md,
    marginTop: spacing.xs,
  },
});
