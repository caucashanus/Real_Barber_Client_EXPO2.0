import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import VisitPlanPagerDots from '@/components/visit-plan/VisitPlanPagerDots';
import VisitPlanPhotoOnboardingScreen from '@/components/visit-plan/onboarding/VisitPlanPhotoOnboardingScreen';
import {
  VISIT_PLAN_ONBOARDING_BENEFIT_IDEAL_DAYS,
  VISIT_PLAN_ONBOARDING_BENEFIT_REMINDER,
  VISIT_PLAN_ONBOARDING_HERO_VIDEO,
  VISIT_PLAN_ONBOARDING_STRESS_FREE_VIDEO,
} from '@/constants/visitPlanOnboardingAssets';
import { useTranslation } from '@/hooks/useTranslation';
import { visitPlanOnboardingFooterReserveHeight } from '@/components/visit-plan/onboarding/visitPlanOnboardingLayout';
import { fillTranslationParams } from '@/utils/fillTranslationParams';

type IntroSlide = {
  id: string;
  kind: 'hero' | 'benefit';
  image?: number;
  video?: number;
  titleKey:
    | 'visitPlanOnboardingHeroTitle'
    | 'visitPlanOnboardingIntroStep1Title'
    | 'visitPlanOnboardingIntroStep2Title'
    | 'visitPlanOnboardingIntroStep3Title';
  descKey:
    | 'visitPlanOnboardingHeroLead'
    | 'visitPlanOnboardingIntroStep1Desc'
    | 'visitPlanOnboardingIntroStep2Desc'
    | 'visitPlanOnboardingIntroStep3Desc';
};

const INTRO_SLIDES: readonly IntroSlide[] = [
  {
    id: 'hero',
    kind: 'hero',
    video: VISIT_PLAN_ONBOARDING_HERO_VIDEO,
    titleKey: 'visitPlanOnboardingHeroTitle',
    descKey: 'visitPlanOnboardingHeroLead',
  },
  {
    id: '1',
    kind: 'benefit',
    image: VISIT_PLAN_ONBOARDING_BENEFIT_REMINDER,
    titleKey: 'visitPlanOnboardingIntroStep1Title',
    descKey: 'visitPlanOnboardingIntroStep1Desc',
  },
  {
    id: '2',
    kind: 'benefit',
    image: VISIT_PLAN_ONBOARDING_BENEFIT_IDEAL_DAYS,
    titleKey: 'visitPlanOnboardingIntroStep2Title',
    descKey: 'visitPlanOnboardingIntroStep2Desc',
  },
  {
    id: '3',
    kind: 'benefit',
    video: VISIT_PLAN_ONBOARDING_STRESS_FREE_VIDEO,
    titleKey: 'visitPlanOnboardingIntroStep3Title',
    descKey: 'visitPlanOnboardingIntroStep3Desc',
  },
] as const;

const LAST_SLIDE_INDEX = INTRO_SLIDES.length - 1;
const { width: SCREEN_W } = Dimensions.get('window');

/** Swipe vlevo na posledním slidu → stejně jako Pokračovat do setupu. */
const LAST_SLIDE_FORWARD_VELOCITY_X = -0.25;

function OnboardingHeader({
  onBack,
  onContinue,
  showContinue,
  onPhoto,
}: {
  onBack: () => void;
  onContinue?: () => void;
  showContinue: boolean;
  onPhoto: boolean;
}) {
  const { t } = useTranslation();
  const textClass = onPhoto ? 'text-white' : 'text-light-primary dark:text-dark-primary';

  return (
    <View className="flex-row items-center justify-between px-2 py-1">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('visitPlanBackAria')}
        className="size-10 items-center justify-center active:opacity-70">
        <Icon name="ChevronLeft" size={28} color={onPhoto ? '#fff' : undefined} />
      </Pressable>
      {showContinue && onContinue ? (
        <Pressable onPress={onContinue} className="px-2 py-2 active:opacity-70">
          <ThemedText className={`text-sm font-semibold ${textClass}`}>
            {t('visitPlanOnboardingHeroCta')}
          </ThemedText>
        </Pressable>
      ) : (
        <View className="size-10" />
      )}
    </View>
  );
}

export default function VisitPlanOnboardingIntroFlow() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [slideIndex, setSlideIndex] = useState(0);
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const slideIndexRef = useRef(0);

  useEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: slideIndex * SCREEN_W, animated: true });
  }, [slideIndex]);

  const leaveOnboarding = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/(home)/real-barber' as never);
  }, []);

  const goToSetup = useCallback(() => {
    router.replace('/screens/visit-plan-setup');
  }, []);

  const goForward = useCallback(() => {
    if (slideIndexRef.current >= LAST_SLIDE_INDEX) {
      goToSetup();
      return;
    }
    setSlideIndex((i) => Math.min(i + 1, LAST_SLIDE_INDEX));
  }, [goToSetup]);

  const onHeaderBack = useCallback(() => {
    if (slideIndexRef.current <= 0) {
      leaveOnboarding();
      return;
    }
    setSlideIndex((i) => i - 1);
  }, [leaveOnboarding]);

  const onHeaderContinue = useCallback(() => {
    goForward();
  }, [goForward]);

  const syncSlideIndexFromOffset = useCallback((x: number) => {
    const idx = Math.round(x / SCREEN_W);
    setSlideIndex(Math.max(0, Math.min(idx, LAST_SLIDE_INDEX)));
  }, []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncSlideIndexFromOffset(e.nativeEvent.contentOffset.x);
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    syncSlideIndexFromOffset(x);

    if (slideIndexRef.current < LAST_SLIDE_INDEX) return;

    const vx = e.nativeEvent.velocity?.x ?? 0;
    if (vx <= LAST_SLIDE_FORWARD_VELOCITY_X) {
      goToSetup();
    }
  };

  const safeBottomPad = Math.max(insets.bottom, 16);
  const footerReserveH = visitPlanOnboardingFooterReserveHeight();

  return (
    <View style={{ flex: 1 }} className="bg-black">
      <FlatList
        ref={listRef}
        data={[...INTRO_SLIDES]}
        horizontal
        pagingEnabled
        bounces={slideIndex === LAST_SLIDE_INDEX}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_W }} className="flex-1">
            <VisitPlanPhotoOnboardingScreen
              title={t(item.titleKey)}
              description={t(item.descKey)}
              imageSource={item.image}
              videoSource={item.video}
              mediaActive={slideIndex === index}
              reserveFooterSpace={item.kind === 'benefit'}
              header={
                <OnboardingHeader
                  onBack={onHeaderBack}
                  onContinue={onHeaderContinue}
                  showContinue={item.kind === 'benefit'}
                  onPhoto
                />
              }
              footer={
                item.kind === 'hero' ? (
                  <AppButton
                    size="lg"
                    variant="default"
                    rounded="full"
                    fullWidth
                    textClassName="text-white"
                    title={t('visitPlanOnboardingHeroCta')}
                    onPress={goForward}
                  />
                ) : undefined
              }
            />
          </View>
        )}
      />
      {slideIndex > 0 ? (
        <View
          className="absolute left-0 right-0 items-center justify-center"
          style={{
            bottom: safeBottomPad + footerReserveH / 2 - 10,
            height: 20,
          }}
          pointerEvents="box-none">
          <VisitPlanPagerDots
            count={INTRO_SLIDES.length}
            activeIndex={slideIndex}
            variant="onPhoto"
            listAccessibilityLabel={t('visitPlanOnboardingBenefitsDotsAria')}
            getDotAccessibilityLabel={(current, total) =>
              fillTranslationParams(t('visitPlanOnboardingBenefitsDotAria'), { current, total })
            }
          />
        </View>
      ) : null}
    </View>
  );
}
