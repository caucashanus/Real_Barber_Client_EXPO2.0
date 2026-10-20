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

type Phase = 'hero' | 'benefits';

const BENEFIT_SLIDES = [
  {
    id: '1',
    image: VISIT_PLAN_ONBOARDING_BENEFIT_REMINDER,
    video: undefined as number | undefined,
    titleKey: 'visitPlanOnboardingIntroStep1Title' as const,
    descKey: 'visitPlanOnboardingIntroStep1Desc' as const,
  },
  {
    id: '2',
    image: VISIT_PLAN_ONBOARDING_BENEFIT_IDEAL_DAYS,
    video: undefined,
    titleKey: 'visitPlanOnboardingIntroStep2Title' as const,
    descKey: 'visitPlanOnboardingIntroStep2Desc' as const,
  },
  {
    id: '3',
    video: VISIT_PLAN_ONBOARDING_STRESS_FREE_VIDEO,
    titleKey: 'visitPlanOnboardingIntroStep3Title' as const,
    descKey: 'visitPlanOnboardingIntroStep3Desc' as const,
  },
] as const;

const { width: SCREEN_W } = Dimensions.get('window');

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
  const [phase, setPhase] = useState<Phase>('hero');
  const [slideIndex, setSlideIndex] = useState(0);
  const benefitsListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (phase !== 'benefits') return;
    benefitsListRef.current?.scrollToOffset({ offset: slideIndex * SCREEN_W, animated: true });
  }, [phase, slideIndex]);

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

  const onHeaderBack = useCallback(() => {
    if (phase === 'benefits') {
      if (slideIndex > 0) {
        setSlideIndex(slideIndex - 1);
        return;
      }
      setPhase('hero');
      setSlideIndex(0);
      return;
    }
    leaveOnboarding();
  }, [phase, slideIndex, leaveOnboarding]);

  const onHeaderContinue = useCallback(() => {
    if (phase === 'hero') {
      setPhase('benefits');
      return;
    }
    if (slideIndex >= BENEFIT_SLIDES.length - 1) {
      goToSetup();
      return;
    }
    setSlideIndex(slideIndex + 1);
  }, [phase, slideIndex, goToSetup]);

  const safeBottomPad = Math.max(insets.bottom, 16);
  const footerReserveH = visitPlanOnboardingFooterReserveHeight();

  const onBenefitsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_W);
    setSlideIndex(Math.max(0, Math.min(idx, BENEFIT_SLIDES.length - 1)));
  };

  if (phase === 'hero') {
    return (
      <View style={{ flex: 1 }}>
      <VisitPlanPhotoOnboardingScreen
        title={t('visitPlanOnboardingHeroTitle')}
        description={t('visitPlanOnboardingHeroLead')}
        videoSource={VISIT_PLAN_ONBOARDING_HERO_VIDEO}
        mediaActive
        header={
          <OnboardingHeader onBack={leaveOnboarding} showContinue={false} onPhoto />
        }
        footer={
          <AppButton
            size="lg"
            variant="default"
            rounded="full"
            fullWidth
            textClassName="text-white"
            title={t('visitPlanOnboardingHeroCta')}
            onPress={() => setPhase('benefits')}
          />
        }
      />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-black">
      <FlatList
        ref={benefitsListRef}
        data={BENEFIT_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onBenefitsScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_W }} className="flex-1">
            <VisitPlanPhotoOnboardingScreen
              title={t(item.titleKey)}
              description={t(item.descKey)}
              imageSource={'image' in item ? item.image : undefined}
              videoSource={item.video}
              mediaActive={slideIndex === index}
              reserveFooterSpace
              header={
                <OnboardingHeader
                  onBack={onHeaderBack}
                  onContinue={onHeaderContinue}
                  showContinue
                  onPhoto
                />
              }
            />
          </View>
        )}
      />
      <View
        className="absolute left-0 right-0 items-center justify-center"
        style={{
          bottom: safeBottomPad + footerReserveH / 2 - 10,
          height: 20,
        }}
        pointerEvents="box-none">
        <VisitPlanPagerDots
          count={BENEFIT_SLIDES.length}
          activeIndex={slideIndex}
          variant="onPhoto"
          listAccessibilityLabel={t('visitPlanOnboardingBenefitsDotsAria')}
          getDotAccessibilityLabel={(current, total) =>
            fillTranslationParams(t('visitPlanOnboardingBenefitsDotAria'), { current, total })
          }
        />
      </View>
    </View>
  );
}
