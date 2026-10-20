import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  computeIdealVisitBannerRange,
  formatVisitPlanDayMonthCompact,
} from '@/utils/visitPlanDates';
import { fillTranslationParams } from '@/utils/fillTranslationParams';

type Props = {
  nextVisitTarget: string;
  onPress?: () => void;
};

export default function VisitPlanNextVisitBanner({ nextVisitTarget, onPress }: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { accentColor } = useAccentColor();

  const { fromIso, toIso } = useMemo(
    () => computeIdealVisitBannerRange(nextVisitTarget),
    [nextVisitTarget]
  );

  const fromLabel = formatVisitPlanDayMonthCompact(fromIso, locale);
  const toLabel = formatVisitPlanDayMonthCompact(toIso, locale);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="self-stretch overflow-hidden rounded-2xl active:opacity-90">
      <LinearGradient
        colors={[accentColor, `${accentColor}D9`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}>
        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-xl bg-white/15">
            <Icon name="CalendarCheck" size={24} color="#fff" />
          </View>
          <View className="min-w-0 flex-1">
            <ThemedText className="font-semibold text-white">
              {t('visitPlanRecommendationTitle')}
            </ThemedText>
            <ThemedText className="mt-0.5 text-sm text-white/90">
              {fillTranslationParams(t('visitPlanRecommendationBannerIdealWindow'), {
                fromDate: fromLabel,
                toDate: toLabel,
              })}
            </ThemedText>
          </View>
          <Icon name="ChevronRight" size={20} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
