import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/hooks/use-theme';

import { GlassSurface } from './glass-surface';

export type OptionCardProps = {
  selected: boolean;
  onSelect: () => void;
  /** The row content. The card draws no indicator of its own: the paywall wants
   * it on the left, onboarding on the right, and a `variant` for that is the
   * creep `PrimaryButton` refuses. */
  children: ReactNode;
  accessibilityLabel?: string;
  /** Merged onto the outer Pressable, for margins and min heights. */
  style?: StyleProp<ViewStyle>;
};

/**
 * One choice in a single-select group: the paywall plans, the onboarding accent,
 * goal, and priority pickers.
 *
 * The glass is an ABSOLUTE SIBLING of the content, not its ancestor. The card's
 * children stay free to hold other native views (a `GlassView`, a `Switch`)
 * without nesting glass, which does not render on iOS 26. The selection border
 * lives on the glass so it hugs the same continuous corners. The `Pressable`
 * wraps everything because the glass is a native material and the touch target
 * must sit above it.
 */
export function OptionCard({
  selected,
  onSelect,
  children,
  accessibilityLabel,
  style,
}: OptionCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.selectionAsync();
        onSelect();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      <GlassSurface
        radius="lg"
        interactive
        style={[
          StyleSheet.absoluteFill,
          selected && { borderWidth: 2, borderColor: colors.accent },
        ]}
      />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
