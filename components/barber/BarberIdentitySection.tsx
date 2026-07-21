import React from 'react';
import { Pressable, View } from 'react-native';

import LiveIndicator from '@/components/LiveIndicator';
import ShowRating from '@/components/ShowRating';
import Avatar from '@/components/Avatar';
import BarberProfileHeaderActions from '@/components/barber/BarberProfileHeaderActions';
import ThemedText from '@/components/ThemedText';
import { getShiftLiveIndicatorVariant, type TodayShiftStatus } from '@/utils/teamMemberPageHelpers';
import type { TranslationKey } from '@/locales';

interface BarberIdentitySectionProps {
  employeeId: string;
  displayName: string;
  avatarUrl?: string | null;
  average: number;
  languages?: string[];
  shiftStatus: TodayShiftStatus;
  shareMessage: string;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberIdentitySection({
  employeeId,
  displayName,
  avatarUrl,
  average,
  languages,
  shiftStatus,
  shareMessage,
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
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center">
                <ThemedText className="shrink text-2xl font-semibold" numberOfLines={1}>
                  {displayName}
                </ThemedText>
                {liveVariant ? (
                  <View className="ml-3 justify-center">
                    <LiveIndicator variant={liveVariant} size="sm" />
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={onScrollToReviews}
                className="mt-1 self-start active:opacity-70">
                <ShowRating rating={average} size="md" numberFirst />
              </Pressable>
            </View>
            <BarberProfileHeaderActions
              employeeId={employeeId}
              displayName={displayName}
              shareMessage={shareMessage}
              onScrollToReviews={onScrollToReviews}
              t={t}
            />
          </View>
          {languageList.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {t('barberLanguages')}
              </ThemedText>
              <ThemedText className="shrink text-sm">{languageList.join(', ')}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
