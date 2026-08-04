import React from 'react';
import { View } from 'react-native';

import LiveIndicator from '@/components/LiveIndicator';
import RatingBadge from '@/components/RatingBadge';
import Avatar from '@/components/Avatar';
import BarberProfileHeaderActions from '@/components/barber/BarberProfileHeaderActions';
import ThemedText from '@/components/ThemedText';
import { getShiftLiveIndicatorVariant, type TodayShiftStatus } from '@/utils/teamMemberPageHelpers';
import { getLanguageFlagEmoji } from '@/utils/phone';
import type { TranslationKey } from '@/locales';

interface BarberIdentitySectionProps {
  employeeId: string;
  displayName: string;
  avatarUrl?: string | null;
  average: number;
  locale?: 'cs' | 'en';
  languages?: string[];
  shiftStatus: TodayShiftStatus;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberIdentitySection({
  employeeId,
  displayName,
  avatarUrl,
  average,
  locale = 'cs',
  languages,
  shiftStatus,
  shareUrl,
  shareTitle,
  shareEmailSubject,
  shareEmailBody,
  onScrollToReviews,
  t,
}: BarberIdentitySectionProps) {
  const languageList = (languages ?? []).filter(Boolean);
  const liveVariant = getShiftLiveIndicatorVariant(shiftStatus);

  return (
    <View>
      <View className="flex-row items-start gap-3">
        <Avatar size="xl" src={avatarUrl ?? undefined} name={displayName} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 items-start">
              <View className="max-w-full flex-row items-center">
                <ThemedText className="shrink text-2xl font-semibold" numberOfLines={1}>
                  {displayName}
                </ThemedText>
                {liveVariant ? (
                  <View className="ml-3 justify-center">
                    <LiveIndicator variant={liveVariant} size="default" />
                  </View>
                ) : null}
              </View>

              {average > 0 ? (
                <View className="mt-1">
                  <RatingBadge
                    rating={average}
                    locale={locale}
                    compact={false}
                    onPress={onScrollToReviews}
                    className="self-start !pl-0"
                  />
                </View>
              ) : null}

              {languageList.length > 0 ? (
                <View className="mt-1 flex-row items-center gap-x-1.5">
                  <ThemedText className="shrink-0 text-xs font-normal text-light-subtext dark:text-dark-subtext">
                    {t('barberLanguages')}
                  </ThemedText>
                  <View className="flex-row items-center gap-x-1">
                    {languageList.map((language, index) => {
                      const flag = getLanguageFlagEmoji(language);
                      if (!flag) return null;
                      return (
                        <ThemedText key={`${language}-${index}`} className="text-base leading-5">
                          {flag}
                        </ThemedText>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>

            <BarberProfileHeaderActions
              employeeId={employeeId}
              displayName={displayName}
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              shareEmailSubject={shareEmailSubject}
              shareEmailBody={shareEmailBody}
              onScrollToReviews={onScrollToReviews}
              t={t}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
