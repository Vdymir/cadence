import Analytics01Icon from '@hugeicons-pro/core-stroke-rounded/Analytics01Icon';
import AnalyticsUpIcon from '@hugeicons-pro/core-stroke-rounded/AnalyticsUpIcon';
import ArrowRight01Icon from '@hugeicons-pro/core-stroke-rounded/ArrowRight01Icon';
import ArrowUpRight01Icon from '@hugeicons-pro/core-stroke-rounded/ArrowUpRight01Icon';
import LockIcon from '@hugeicons-pro/core-stroke-rounded/LockIcon';
import MenuTwoLineIcon from '@hugeicons-pro/core-stroke-rounded/MenuTwoLineIcon';
import Mic01Icon from '@hugeicons-pro/core-stroke-rounded/Mic01Icon';
import PlayIcon from '@hugeicons-pro/core-stroke-rounded/PlayIcon';
import Target01Icon from '@hugeicons-pro/core-stroke-rounded/Target01Icon';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/ui';
import { marketing, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ClarityMark } from './clarity-mark';

const HERO_IMAGE = require('@/assets/marketing/clarity-hero-cutout.png');

const FEATURES = [
  {
    icon: Mic01Icon,
    title: 'Practice your way',
    body: 'Read a passage, speak freely, or add your own text. Start with the kind of speaking you want to improve.',
  },
  {
    icon: Analytics01Icon,
    title: 'See the full picture',
    body: 'Get one speaking score plus Articulation, Flow, Pacing, Fillers, and Expression after every session.',
  },
  {
    icon: AnalyticsUpIcon,
    title: 'Know what changed',
    body: 'Compare each session with your last one. The movement in every skill is specific and easy to spot.',
  },
  {
    icon: Target01Icon,
    title: 'Leave with a next step',
    body: 'Finish with one focused coaching note. Use it in your next session while the lesson is still fresh.',
  },
] as const;

const NAV_ITEMS = [
  { label: 'Product', anchor: 'product' },
  { label: 'How it works', anchor: 'features' },
  { label: 'Progress', anchor: 'features' },
  { label: 'Privacy', anchor: 'privacy' },
] as const;

function scrollTo(anchor: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Wordmark({ mobile = false }: { mobile?: boolean }) {
  return (
    <View style={[styles.wordmark, mobile && styles.wordmarkMobile]}>
      <ClarityMark size={mobile ? marketing.size.navMarkMobile : marketing.size.navMark} />
      <ThemedText
        variant={mobile ? 'marketingWordmarkMobile' : 'marketingWordmark'}
        tone="marketingPrimary">
        clarity
      </ThemedText>
    </View>
  );
}

function Navigation({ desktop, pageWidth }: { desktop: boolean; pageWidth: number }) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (desktop) {
    return (
      <View style={[styles.navigation, { width: pageWidth }]}>
        <Wordmark />
        <View style={styles.navLinks}>
          {NAV_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="link"
              onPress={() => scrollTo(item.anchor)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText
                variant="marketingNav"
                weight={index === 0 ? 'medium' : undefined}
                tone={index === 0 ? 'marketingPrimary' : 'marketingSecondary'}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <Link href={marketing.links.earlyTester} asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.navCta,
              { borderColor: colors.marketingLine },
              pressed && styles.pressed,
            ]}>
            <ThemedText variant="marketingNavStrong" tone="marketingPrimary">
              Get early access
            </ThemedText>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={marketing.size.metaIcon}
              color={colors.marketingInk}
              strokeWidth={marketing.iconStrokeWidth}
            />
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.navigationMobile,
        { borderColor: colors.marketingLine, width: pageWidth },
      ]}>
      <Wordmark mobile />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        accessibilityState={{ expanded: menuOpen }}
        onPress={() => setMenuOpen((open) => !open)}
        style={({ pressed }) => [
          styles.menuButton,
          { borderColor: colors.marketingLine },
          pressed && styles.pressed,
        ]}>
        <HugeiconsIcon
          icon={MenuTwoLineIcon}
          size={marketing.size.actionIconMobile}
          color={colors.marketingInk}
          strokeWidth={marketing.iconStrokeWidth}
        />
      </Pressable>
      {menuOpen ? (
        <View
          style={[
            styles.mobileMenu,
            {
              backgroundColor: colors.marketingCanvas,
              borderColor: colors.marketingLine,
            },
          ]}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="link"
              onPress={() => {
                setMenuOpen(false);
                scrollTo(item.anchor);
              }}
              style={({ pressed }) => [styles.mobileMenuItem, pressed && styles.pressed]}>
              <ThemedText variant="marketingNavStrong" tone="marketingPrimary">
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AppIcon({ mobile }: { mobile: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.appIcon,
        { borderColor: colors.marketingLine },
        mobile && styles.appIconMobile,
      ]}>
      <ClarityMark size={mobile ? marketing.size.appIconMarkMobile : marketing.size.appIconMark} />
    </View>
  );
}

function HeroAction({
  icon,
  label,
  mobile,
  primary = false,
  disabled = false,
  onPress,
}: {
  icon: IconSvgElement;
  label: string;
  mobile: boolean;
  primary?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={disabled ? 'button' : 'link'}
      accessibilityHint={disabled ? 'Coming soon' : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroAction,
        mobile && styles.heroActionMobile,
        primary && { backgroundColor: colors.marketingInverse },
        mobile && !primary && styles.heroActionSecondaryMobile,
        disabled && styles.heroActionDisabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText
        variant={mobile ? 'marketingButtonMobile' : 'marketingButton'}
        tone={primary ? 'marketingInverse' : 'marketingPrimary'}>
        {label}
      </ThemedText>
      <HugeiconsIcon
        icon={icon}
        size={mobile ? marketing.size.actionIconMobile : marketing.size.actionIcon}
        color={primary ? colors.marketingOnInverse : colors.marketingInk}
        strokeWidth={marketing.iconStrokeWidth}
      />
    </Pressable>
  );
}

function HeroArtwork({ desktop, width }: { desktop: boolean; width: number }) {
  const desktopWidth = Math.min(width, marketing.width.heroArtwork);
  const desktopScale = desktopWidth / marketing.width.heroArtwork;

  return (
    <View
      style={[
        styles.artwork,
        desktop
          ? {
              width: desktopWidth,
              height: marketing.height.artwork * desktopScale,
            }
          : styles.artworkMobile,
      ]}>
      <Image
        accessibilityLabel="A hand holding a phone while Clarity follows a spoken passage"
        source={HERO_IMAGE}
        resizeMode="contain"
        style={
          desktop
            ? {
                width: marketing.artwork.desktopImageWidth * desktopScale,
                height: marketing.artwork.desktopImageHeight * desktopScale,
              }
            : styles.artworkImageMobile
        }
      />
      {desktop ? <View pointerEvents="none" style={[styles.artworkFade, webFadeStyle]} /> : null}
    </View>
  );
}

function Hero({ desktop, pageWidth }: { desktop: boolean; pageWidth: number }) {
  const { colors } = useTheme();
  const copyWidth = desktop ? Math.min(pageWidth, marketing.width.heroCopy) : pageWidth;

  return (
    <View
      nativeID="product"
      style={[
        styles.hero,
        { width: pageWidth },
        !desktop && styles.heroMobile,
      ]}>
      <View
        style={[
          styles.heroCopy,
          { width: copyWidth },
          !desktop && styles.heroCopyMobile,
        ]}>
        <AppIcon mobile={!desktop} />
        {!desktop ? (
          <View style={styles.kicker}>
            <View style={[styles.kickerDot, { backgroundColor: colors.marketingAccent }]} />
            <ThemedText variant="marketingKickerMobile" tone="marketingSecondary">
              A clearer way to practice
            </ThemedText>
          </View>
        ) : null}
        <ThemedText
          variant={desktop ? 'marketingDisplay' : 'marketingDisplayMobile'}
          tone="marketingPrimary"
          style={[
            styles.centeredText,
            {
              width: desktop ? Math.min(marketing.width.heroTitle, pageWidth) : pageWidth,
            },
          ]}>
          {desktop ? 'Speak clearly.\nSound like yourself.' : 'Speak clearly.\nSound like\nyourself.'}
        </ThemedText>
        <ThemedText
          variant={desktop ? 'marketingBody' : 'marketingHeroBodyMobile'}
          tone="marketingSecondary"
          style={[
            styles.centeredText,
            {
              width: desktop
                ? Math.min(marketing.width.heroBody, pageWidth)
                : Math.min(marketing.width.mobileHeroBody, pageWidth),
            },
          ]}>
          Clarity listens while you practice, follows every word, and shows you what to work on
          next.
        </ThemedText>
      </View>

      <View style={[styles.heroActions, !desktop && styles.heroActionsMobile]}>
        <View style={[styles.comingSoonAction, !desktop && styles.comingSoonActionMobile]}>
          <HeroAction
            icon={ArrowRight01Icon}
            label="Get Clarity"
            mobile={!desktop}
            primary
            disabled
          />
          <ThemedText
            variant={desktop ? 'marketingMeta' : 'marketingMetaMobile'}
            tone="marketingSecondary">
            Coming soon
          </ThemedText>
        </View>
        <HeroAction
          icon={PlayIcon}
          label="See how it works"
          mobile={!desktop}
          onPress={() => scrollTo('features')}
        />
      </View>

      <View
        nativeID="privacy"
        style={[
          styles.privacy,
          !desktop && styles.privacyMobile,
          !desktop && { width: Math.min(marketing.width.mobilePrivacy, pageWidth) },
        ]}>
        <HugeiconsIcon
          icon={LockIcon}
          size={marketing.size.metaIcon}
          color={colors.marketingMuted}
          strokeWidth={marketing.iconStrokeWidth}
        />
        <ThemedText
          variant={desktop ? 'marketingMeta' : 'marketingMetaMobile'}
          tone="marketingSecondary"
          style={!desktop && styles.privacyCopyMobile}>
          No account. No cloud history. Your practice stays on your device.
        </ThemedText>
      </View>

      <HeroArtwork desktop={desktop} width={pageWidth} />
    </View>
  );
}

function Feature({
  body,
  desktop,
  icon,
  title,
  width,
}: {
  body: string;
  desktop: boolean;
  icon: IconSvgElement;
  title: string;
  width: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.feature,
        { width },
        desktop ? styles.featureDesktop : styles.featureMobile,
      ]}>
      <HugeiconsIcon
        icon={icon}
        size={marketing.size.featureIcon}
        color={colors.marketingAccent}
        strokeWidth={marketing.iconStrokeWidth}
      />
      <View style={styles.featureCopy}>
        <ThemedText
          variant={desktop ? 'marketingFeature' : 'marketingFeatureMobile'}
          tone="marketingPrimary">
          {title}
        </ThemedText>
        <ThemedText
          variant={desktop ? 'marketingBody' : 'marketingBodyMobile'}
          tone="marketingSecondary">
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

function Features({ desktop, pageWidth }: { desktop: boolean; pageWidth: number }) {
  const { colors } = useTheme();
  const columnWidth = desktop
    ? (pageWidth - marketing.gap.featureColumns) / 2
    : pageWidth;

  return (
    <View
      nativeID="features"
      style={[
        styles.features,
        { borderColor: colors.marketingLine, width: pageWidth },
        !desktop && styles.featuresMobile,
      ]}>
      <View style={[styles.featuresHeading, { width: pageWidth }]}>
        <ThemedText
          variant={desktop ? 'marketingEyebrow' : 'marketingEyebrowMobile'}
          tone="marketingAccent"
          style={styles.centeredText}>
          Practice with purpose
        </ThemedText>
        <ThemedText
          variant={desktop ? 'marketingSection' : 'marketingSectionMobile'}
          tone="marketingPrimary"
          style={[
            styles.centeredText,
            {
              width: desktop ? Math.min(marketing.width.sectionTitle, pageWidth) : pageWidth,
            },
          ]}>
          Everything you need to speak with confidence.
        </ThemedText>
        <ThemedText
          variant={desktop ? 'marketingBody' : 'marketingBody'}
          tone="marketingSecondary"
          style={[
            styles.centeredText,
            {
              width: desktop
                ? Math.min(marketing.width.sectionBody, pageWidth)
                : Math.min(marketing.width.mobileSectionBody, pageWidth),
            },
          ]}>
          {desktop
            ? 'Choose how you want to practice. Clarity listens, scores the skills that matter, and gives you one clear thing to work on next.'
            : 'Choose how you want to practice. Clarity scores the skills that matter and gives you one clear thing to work on next.'}
        </ThemedText>
      </View>

      {desktop ? (
        <View style={styles.featureColumns}>
          <View style={[styles.featureColumn, { width: columnWidth }]}>
            {[FEATURES[0], FEATURES[2]].map((feature) => (
              <Feature key={feature.title} {...feature} desktop width={columnWidth} />
            ))}
          </View>
          <View style={[styles.featureColumn, { width: columnWidth }]}>
            {[FEATURES[1], FEATURES[3]].map((feature) => (
              <Feature key={feature.title} {...feature} desktop width={columnWidth} />
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.featureListMobile, { width: pageWidth }]}>
          {FEATURES.map((feature) => (
            <Feature key={feature.title} {...feature} desktop={false} width={columnWidth} />
          ))}
        </View>
      )}
    </View>
  );
}

export function MarketingLandingPage() {
  const { colors } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(false);
  // Render the 390px artboard on the server and on the first client pass. Once
  // hydration finishes, switch to the real viewport without a markup mismatch.
  useEffect(() => setHydrated(true), []);
  const width = hydrated ? viewportWidth : marketing.breakpoints.mobile;
  const desktop = width >= marketing.breakpoints.desktop;
  const phone = width < marketing.breakpoints.tablet;
  const availableWidth = Math.max(width - marketing.inset.gutter * 2, 0);
  const pageWidth = Math.min(
    availableWidth,
    desktop ? marketing.width.page : phone ? marketing.width.mobile : marketing.width.tablet,
  );

  return (
    <>
      <Head>
        <title>Clarity — Speak clearly. Sound like yourself.</title>
        <meta
          name="description"
          content="Clarity follows every word while you practice and shows you what to work on next."
        />
      </Head>
      <ScrollView
        style={[styles.page, { backgroundColor: colors.marketingCanvas }]}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}>
        <Navigation desktop={desktop} pageWidth={pageWidth} />
        <Hero desktop={desktop} pageWidth={pageWidth} />
        <Features desktop={desktop} pageWidth={pageWidth} />
      </ScrollView>
    </>
  );
}

const webFadeStyle = {
  backgroundImage: marketing.artwork.fade,
} as unknown as ViewStyle;

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageContent: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  navigation: {
    alignItems: 'center',
    flexDirection: 'row',
    height: marketing.height.nav,
    justifyContent: 'space-between',
  },
  navigationMobile: {
    alignItems: 'center',
    borderBottomWidth: marketing.borderWidth,
    flexDirection: 'row',
    height: marketing.height.navMobile,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: marketing.layer.menu,
  },
  wordmark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: marketing.gap.navWordmark,
  },
  wordmarkMobile: {
    gap: marketing.gap.navWordmarkMobile,
  },
  navLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: marketing.gap.navLinks,
  },
  navCta: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    borderWidth: marketing.borderWidth,
    flexDirection: 'row',
    gap: marketing.gap.navCta,
    height: marketing.height.navCta,
    paddingHorizontal: marketing.inset.navCtaHorizontal,
  },
  menuButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    borderWidth: marketing.borderWidth,
    height: marketing.size.mobileMenu,
    justifyContent: 'center',
    width: marketing.size.mobileMenu,
  },
  mobileMenu: {
    borderCurve: 'continuous',
    borderRadius: radius.sm,
    borderWidth: marketing.borderWidth,
    padding: spacing.sm,
    position: 'absolute',
    right: 0,
    top: marketing.height.navMobile,
  },
  mobileMenuItem: {
    alignItems: 'flex-end',
    height: marketing.height.mobileMenuItem,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: marketing.gap.hero,
    paddingBottom: marketing.inset.heroBottom,
    paddingTop: marketing.inset.heroTop,
  },
  heroMobile: {
    gap: marketing.gap.heroMobile,
    paddingBottom: 0,
    paddingTop: marketing.inset.heroTopMobile,
  },
  heroCopy: {
    alignItems: 'center',
    gap: marketing.gap.heroCopy,
  },
  heroCopyMobile: {
    gap: marketing.gap.heroCopyMobile,
  },
  appIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: marketing.radius.appIcon,
    borderWidth: marketing.borderWidth,
    height: marketing.size.appIcon,
    justifyContent: 'center',
    width: marketing.size.appIcon,
  },
  appIconMobile: {
    borderRadius: radius.md,
    height: marketing.size.appIconMobile,
    width: marketing.size.appIconMobile,
  },
  kicker: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: marketing.gap.kicker,
  },
  kickerDot: {
    borderRadius: radius.full,
    height: marketing.size.kickerDot,
    width: marketing.size.kickerDot,
  },
  centeredText: {
    textAlign: 'center',
  },
  heroActions: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: marketing.gap.heroActions,
  },
  heroActionsMobile: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: marketing.gap.heroActionsMobile,
    width: '100%',
  },
  comingSoonAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  comingSoonActionMobile: {
    width: '100%',
  },
  heroAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: marketing.gap.heroButton,
    height: marketing.height.heroCta,
    paddingHorizontal: marketing.inset.heroCtaHorizontal,
  },
  heroActionMobile: {
    height: marketing.height.heroCtaMobile,
    justifyContent: 'center',
    width: '100%',
  },
  heroActionSecondaryMobile: {
    height: marketing.height.secondaryCtaMobile,
    width: 'auto',
  },
  heroActionDisabled: {
    opacity: marketing.opacity.disabled,
  },
  privacy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: marketing.gap.meta,
  },
  privacyMobile: {
    alignItems: 'flex-start',
    gap: marketing.gap.metaMobile,
    justifyContent: 'center',
  },
  privacyCopyMobile: {
    flex: 1,
  },
  artwork: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  artworkMobile: {
    height: marketing.height.artworkMobile,
    width: marketing.width.mobileArtwork,
  },
  artworkImageMobile: {
    height: marketing.artwork.mobileImageHeight,
    width: marketing.artwork.mobileImageWidth,
  },
  artworkFade: {
    bottom: 0,
    height: marketing.artwork.fadeHeight,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  features: {
    alignItems: 'center',
    borderBottomWidth: marketing.borderWidth,
    gap: marketing.gap.section,
    paddingBottom: marketing.inset.section,
    paddingTop: marketing.inset.section,
  },
  featuresMobile: {
    gap: marketing.gap.sectionMobile,
    paddingBottom: marketing.inset.sectionMobile,
    paddingTop: marketing.inset.sectionMobile,
  },
  featuresHeading: {
    alignItems: 'center',
    gap: marketing.gap.sectionHeading,
  },
  featureColumns: {
    flexDirection: 'row',
    gap: marketing.gap.featureColumns,
  },
  featureColumn: {
    gap: marketing.gap.featureRows,
  },
  featureListMobile: {
    gap: marketing.gap.featureRowsMobile,
  },
  feature: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  featureDesktop: {
    gap: marketing.gap.featureIcon,
    minHeight: marketing.height.featureDesktop,
  },
  featureMobile: {
    gap: marketing.gap.featureIconMobile,
    minHeight: marketing.height.featureMobile,
  },
  featureCopy: {
    flex: 1,
    gap: marketing.gap.featureCopy,
    minWidth: 0,
  },
  pressed: {
    opacity: marketing.opacity.pressed,
  },
});
