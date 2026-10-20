import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { VISIT_PLAN_INTERVAL_ICON } from '@/constants/visitPlanSetupWizardOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { VisitPlanCalendarTerm } from '@/utils/visitPlanCalendarTerms';
import { formatVisitPlanDayMonthLong } from '@/utils/visitPlanDates';

type Props = {
  terms: VisitPlanCalendarTerm[];
  onRecommendedPress?: (dateIso: string) => void;
};

/** Stejný panel jako kalendář na stránce — SurfaceCard nahoře, tap uvnitř. */
export default function VisitPlanCalendarTermsList({ terms, onRecommendedPress }: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  if (terms.length === 0) return null;

  return (
    <View className="w-full gap-2 self-stretch">
      {terms.map((term) => (
        <SurfaceCard
          key={term.id}
          rounded="2xl"
          className="w-full self-stretch">
          <Pressable
            onPress={() => onRecommendedPress?.(term.dateIso)}
            disabled={!onRecommendedPress}
            className="flex-row items-center gap-3 p-3 active:opacity-80">
            <Image
              source={VISIT_PLAN_INTERVAL_ICON}
              style={{ width: 44, height: 44 }}
              contentFit="contain"
            />
            <View className="min-w-0 flex-1">
              <ThemedText className="font-semibold">
                {formatVisitPlanDayMonthLong(term.dateIso, locale)}
              </ThemedText>
              <ThemedText className="text-[11px] leading-tight text-light-subtext dark:text-dark-subtext">
                {t('visitPlanTermRecommendedSubtitle')}
              </ThemedText>
            </View>
            <View className="rounded-full bg-accent/20 px-2.5 py-1">
              <ThemedText className="text-xs font-semibold text-accent">
                {t('visitPlanTermRecommendedBadge')}
              </ThemedText>
            </View>
            <Icon name="ChevronRight" size={20} className="text-light-subtext dark:text-dark-subtext" />
          </Pressable>
        </SurfaceCard>
      ))}
    </View>
  );
}
