import React from 'react';
import { Pressable, Text, View } from 'react-native';

import Favorite from '@/components/Favorite';
import LiveIndicator from '@/components/LiveIndicator';
import ShowRating from '@/components/ShowRating';
import Avatar from '@/components/Avatar';
import ThemedText from '@/components/ThemedText';
import { getShiftLiveIndicatorVariant, type TodayShiftStatus } from '@/utils/teamMemberPageHelpers';
import { getLanguageFlagEmoji } from '@/utils/phone';
import type { TranslationKey } from '@/locales';

interface BarberIdentitySectionProps {
  employeeId: string;
  displayName: string;
  avatarUrl?: string | null;
  average: number;
  languages?: string[];
  shiftStatus: TodayShiftStatus;
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
  onScrollToReviews,
  t,
}: BarberIdentitySectionProps) {
  const languageList = (languages ?? []).filter(Boolean);
  const languageFlags = languageList
    .map((language) => ({ language, flag: getLanguageFlagEmoji(language) }))
    .filter((item): item is { language: string; flag: string } => Boolean(item.flag));
  const liveVariant = getShiftLiveIndicatorVariant(shiftStatus);

  return (
    <View className="mb-6">
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
            <Favorite
              productName={displayName}
              title={displayName}
              entityType="employee"
              entityId={employeeId}
              size={22}
            />
          </View>
          {languageFlags.length > 0 ? (
            <View className="mt-3">
              <ThemedText className="mb-1 text-xs text-light-subtext dark:text-dark-subtext">
                {t('barberLanguages')}
              </ThemedText>
              <View className="flex-row flex-wrap items-center gap-2">
                {languageFlags.map(({ language, flag }) => (
                  <Text
                    key={language}
                    accessibilityLabel={language}
                    style={{ fontSize: 20, lineHeight: 24 }}>
                    {flag}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
