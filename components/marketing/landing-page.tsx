import Analytics01Icon from '@hugeicons-pro/core-stroke-rounded/Analytics01Icon';
import AnalyticsUpIcon from '@hugeicons-pro/core-stroke-rounded/AnalyticsUpIcon';
import ArrowRight01Icon from '@hugeicons-pro/core-stroke-rounded/ArrowRight01Icon';
import ArrowUpRight01Icon from '@hugeicons-pro/core-stroke-rounded/ArrowUpRight01Icon';
import MenuTwoLineIcon from '@hugeicons-pro/core-stroke-rounded/MenuTwoLineIcon';
import Mic01Icon from '@hugeicons-pro/core-stroke-rounded/Mic01Icon';
import PlayIcon from '@hugeicons-pro/core-stroke-rounded/PlayIcon';
import Target01Icon from '@hugeicons-pro/core-stroke-rounded/Target01Icon';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { Asset, useAssets } from 'expo-asset';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { useState, useSyncExternalStore } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui';
import { marketing, motion, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ClarityMark } from './clarity-mark';

const SCREENSHOTS = [
  {
    source: require('@/assets/marketing/screenshots/screen-01.jpg'),
    alt: 'Clarity following a passage word by word while it is read aloud',
  },
  {
    source: require('@/assets/marketing/screenshots/screen-02.jpg'),
    alt: 'A word breakdown marking which words were clear, unclear, skipped, or added',
  },
  {
    source: require('@/assets/marketing/screenshots/screen-03.jpg'),
    alt: 'The analytics tab showing a speaking score trend and per-skill scores',
  },
  {
    source: require('@/assets/marketing/screenshots/screen-04.jpg'),
    alt: 'The practice tab with recommended passages, one-minute drills, and freestyle',
  },
  {
    source: require('@/assets/marketing/screenshots/screen-05.jpg'),
    alt: 'The passage editor holding a speech pasted in by hand',
  },
] as const;

const HERO_IMAGE = require('@/assets/marketing/clarity-hero-cutout.png');
const HERO_ASSET = Asset.fromModule(HERO_IMAGE);
const HERO_IMAGE_URI = HERO_ASSET.uri;

// The cutout's wrist runs off the bottom of its own frame, and the bottom fade
// is what hides that cut. Letterboxing lifts the image edge out from under the
// fade, so the box tracks the file's ratio instead of the artboard's.
const HERO_ASPECT =
  HERO_ASSET.width && HERO_ASSET.height
    ? HERO_ASSET.width / HERO_ASSET.height
    : marketing.width.heroArtwork / marketing.height.artwork;

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const FADE_IN = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

const FADE_IN_UP = {
  from: {
    opacity: 0,
    transform: [{ translateY: motion.enterOffset }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
};

const EASE_OUT = cubicBezier(...motion.easeOut);

type MarketingRevealProps = ViewProps & {
  order: number;
};

/** One-shot first-load entrance. The page mounts this only after its fonts,
 * viewport, and hero asset are ready, so the animation never masks reflow. */
function MarketingReveal({ order, style, children, ...rest }: MarketingRevealProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      {...rest}
      style={[
        style,
        {
          animationName: reducedMotion ? FADE_IN : FADE_IN_UP,
          animationDuration: `${reducedMotion ? motion.fast : motion.slow}ms`,
          animationDelay: `${order * motion.stagger}ms`,
          animationTimingFunction: EASE_OUT,
          animationFillMode: 'both',
        },
      ]}>
      {children}
    </Animated.View>
  );
}

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
  { label: 'Screens', anchor: 'screens' },
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
      <MarketingReveal order={0} style={[styles.navigation, { width: pageWidth }]}>
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
          <Pressable accessibilityRole="link">
            {({ pressed }) => (
              <View
                style={[
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
              </View>
            )}
          </Pressable>
        </Link>
      </MarketingReveal>
    );
  }

  return (
    <MarketingReveal
      order={0}
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
    </MarketingReveal>
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
  iconStyle,
  label,
  mobile,
  primary = false,
  disabled = false,
  onPress,
}: {
  icon: IconSvgElement;
  iconStyle?: ViewStyle;
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
        style={iconStyle}
        size={mobile ? marketing.size.actionIconMobile : marketing.size.actionIcon}
        color={primary ? colors.marketingOnInverse : colors.marketingInk}
        strokeWidth={marketing.iconStrokeWidth}
      />
    </Pressable>
  );
}

function HeroArtwork({ desktop, width }: { desktop: boolean; width: number }) {
  const referenceWidth = desktop
    ? marketing.width.heroArtwork
    : marketing.width.mobileArtwork;
  const referenceHeight = desktop
    ? marketing.height.artwork
    : marketing.height.artworkMobile;
  const artworkWidth = Math.min(width, referenceWidth);
  const artworkHeight = Math.min(
    referenceHeight * (artworkWidth / referenceWidth),
    artworkWidth / HERO_ASPECT,
  );
  const artworkSize = { width: artworkWidth, height: artworkHeight };

  return (
    <View style={[styles.artwork, artworkSize]}>
      <Image
        accessibilityLabel="A hand holding a phone while Clarity follows a spoken passage"
        source={HERO_IMAGE}
        resizeMode="contain"
        style={artworkSize}
      />
      <View
        pointerEvents="none"
        style={[
          styles.artworkFade,
          { height: artworkHeight * marketing.artwork.fadeRatio },
          webFadeStyle,
        ]}
      />
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
      <MarketingReveal
        order={1}
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
          {'Speak clearly.\nSound like you.'}
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
      </MarketingReveal>

      <MarketingReveal order={1} style={[styles.heroActions, !desktop && styles.heroActionsMobile]}>
        <View style={[styles.comingSoonAction, !desktop && styles.comingSoonActionMobile]}>
          <HeroAction
            icon={ArrowRight01Icon}
            // The chevron's path sits just below the SF Rounded label's optical center.
            iconStyle={{ transform: [{ translateY: -0.5 }] }}
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
      </MarketingReveal>

      <MarketingReveal order={2} style={styles.artworkReveal}>
        <HeroArtwork desktop={desktop} width={pageWidth} />
      </MarketingReveal>
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
  const columnWidth = desktop
    ? (pageWidth - marketing.gap.featureColumns) / 2
    : pageWidth;

  return (
    <View
      nativeID="features"
      style={[styles.features, { width: pageWidth }, !desktop && styles.featuresMobile]}>
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

function Screens({
  desktop,
  pageWidth,
  viewportWidth,
}: {
  desktop: boolean;
  pageWidth: number;
  viewportWidth: number;
}) {
  const { colors } = useTheme();
  const cardWidth = desktop ? marketing.width.screenshot : marketing.width.screenshotMobile;
  const cardSize = {
    height: Math.round(cardWidth / marketing.screenshot.aspect),
    width: cardWidth,
  };
  // The row scrolls, so it runs to the viewport edge instead of stopping at the
  // page gutter. Clipping a card against the gutter reads as a broken layout;
  // clipping it against the screen reads as "there is more, keep scrolling".
  const rowWidth = desktop ? pageWidth : viewportWidth;
  const edgeInset = Math.max((viewportWidth - pageWidth) / 2, 0);

  return (
    <View
      nativeID="screens"
      style={[styles.screens, { width: rowWidth }, !desktop && styles.screensMobile]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: rowWidth }}
        contentContainerStyle={[
          styles.screenshotRow,
          !desktop && styles.screenshotRowMobile,
          !desktop && { paddingHorizontal: edgeInset },
        ]}>
        {SCREENSHOTS.map((screenshot) => (
          <View
            key={screenshot.alt}
            style={[styles.screenshot, cardSize, { borderColor: colors.marketingLine }]}>
            <Image
              accessibilityLabel={screenshot.alt}
              source={screenshot.source}
              resizeMode="cover"
              style={cardSize}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function MarketingLandingPage() {
  const { colors } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const [heroAssets, heroAssetError] = useAssets([HERO_IMAGE]);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  // Do not paint the server's fallback artboard. The old 390px-first pass was
  // visible on desktop, then reflowed the entire page after hydration.
  const ready = hydrated && Boolean(heroAssets || heroAssetError);
  const width = viewportWidth;
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
        <title>Clarity: Speak clearly. Sound like you.</title>
        <meta
          name="description"
          content="Clarity follows every word while you practice and shows you what to work on next."
        />
        <link rel="preload" as="image" href={HERO_IMAGE_URI} />
      </Head>
      {ready ? (
        <ScrollView
          style={[styles.page, { backgroundColor: colors.marketingCanvas }]}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}>
          <Navigation desktop={desktop} pageWidth={pageWidth} />
          <Hero desktop={desktop} pageWidth={pageWidth} />
          <Features desktop={desktop} pageWidth={pageWidth} />
          <Screens desktop={desktop} pageWidth={pageWidth} viewportWidth={width} />
        </ScrollView>
      ) : (
        <View style={[styles.page, { backgroundColor: colors.marketingCanvas }]} />
      )}
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
  artwork: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  artworkReveal: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  artworkFade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  features: {
    alignItems: 'center',
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
  screens: {
    alignItems: 'center',
    paddingBottom: marketing.inset.section,
    paddingTop: marketing.inset.section,
  },
  screensMobile: {
    paddingBottom: marketing.inset.sectionMobile,
    paddingTop: marketing.inset.sectionMobile,
  },
  screenshotRow: {
    gap: marketing.gap.screenshots,
    // The row scrolls whenever the cards outgrow the page, so it centers only
    // while they still fit.
    justifyContent: 'center',
    minWidth: '100%',
  },
  screenshotRowMobile: {
    gap: marketing.gap.screenshotsMobile,
  },
  screenshot: {
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    borderWidth: marketing.borderWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: marketing.opacity.pressed,
  },
});
