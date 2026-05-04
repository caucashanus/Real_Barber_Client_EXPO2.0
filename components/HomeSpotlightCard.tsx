import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Clipboard, Linking, Pressable, View } from 'react-native';
import { type ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/app/contexts/ThemeContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import {
  type HomeSpotlight,
  HOME_SPOTLIGHT_TITLE_KEY,
  formatHomeBookingSlotLabel,
  formatHomeSpotlightCountdown,
  getHomeSpotlightReviewPath,
} from '@/utils/homeSpotlight';

export function HomeSpotlightCard({
  spotlight,
  t,
  locale,
}: {
  spotlight: HomeSpotlight;
  t: (key: TranslationKey) => string;
  locale: string;
}) {
  const { booking, state, msUntilStart, existingReviewRating } = spotlight;
  const { isDark } = useTheme();
  const navSheetRef = useRef<ActionSheetRef>(null);

  const openMaps = (app: 'google' | 'waze') => {
    navSheetRef.current?.hide();
    const address = encodeURIComponent(booking.branch?.address ?? booking.branch?.name ?? '');
    setTimeout(() => {
      if (app === 'google') {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
      } else {
        Linking.openURL(`https://waze.com/ul?q=${address}&navigate=yes`);
      }
    }, 300);
  };

  const titleKey: TranslationKey =
    state === 'review' && existingReviewRating != null
      ? 'homeSpotlightReviewRated'
      : HOME_SPOTLIGHT_TITLE_KEY[state];
  const subtitle = state === 'today' ? formatHomeSpotlightCountdown(msUntilStart, locale) : null;
  const showIndicator = state !== 'review';
  const indicatorVariant = state === 'current' ? 'green' : 'orange';
  const starFilledColor = isDark ? '#fbbf24' : '#f59e0b';
  const starEmptyColor = isDark ? '#525252' : '#d4d4d4';

  return (
    <>
      <Pressable
        onPress={() => {
          if (state === 'review') return;
          router.push(`/screens/trip-detail?id=${encodeURIComponent(booking.id)}` as any);
        }}
        className="active:opacity-70">
        <View style={{ overflow: 'visible' }}>
          <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
            <View className="w-1 self-stretch">
              {showIndicator ? (
                <View
                  className={`flex-1 rounded-l-2xl ${indicatorVariant === 'green' ? 'bg-green-500 dark:bg-green-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                />
              ) : (
                <View className="flex-1 rounded-l-2xl bg-neutral-300 dark:bg-neutral-600" />
              )}
            </View>
            <View className="flex-1 flex-row items-center gap-3 px-4 py-4">
              <Avatar
                size="md"
                src={booking.employee?.avatarUrl ?? undefined}
                name={booking.employee?.name ?? undefined}
              />
              <View className="min-w-0 flex-1">
                {state === 'review' ? (
                  <View>
                    <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                      {t(titleKey)}
                    </ThemedText>
                    <View className="mt-3 flex-row gap-1.5">
                      {([1, 2, 3, 4, 5] as const).map((rating) => {
                        const filled =
                          existingReviewRating != null && rating <= existingReviewRating;
                        return (
                          <Pressable
                            key={rating}
                            hitSlop={6}
                            onPress={() =>
                              router.push(getHomeSpotlightReviewPath(booking, rating) as any)
                            }>
                            <Icon
                              name="Star"
                              size={30}
                              color={filled ? starFilledColor : starEmptyColor}
                              fill={filled ? starFilledColor : 'none'}
                              strokeWidth={filled ? 1.5 : 2}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                    {t(titleKey)}
                  </ThemedText>
                )}
                {state !== 'review' && (
                  <ThemedText
                    className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                    numberOfLines={1}>
                    {booking.employee?.name ?? '—'} · {booking.branch?.name ?? ''}
                  </ThemedText>
                )}
                {subtitle ? (
                  <View className="mt-1.5 flex-row items-center gap-1.5">
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      {subtitle}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              {state !== 'soon' && (
                <Icon
                  name="ChevronRight"
                  size={16}
                  className="text-light-subtext dark:text-dark-subtext"
                />
              )}
            </View>
          </View>
          {state === 'current' ? (
            <View
              className="absolute flex-row items-center rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900/30"
              style={{ top: -8, right: 12 }}>
              <LiveIndicator variant="green" size="sm" />
            </View>
          ) : state !== 'review' ? (
            <View
              className="absolute flex-row items-center rounded-full bg-neutral-800 px-2.5 py-1 dark:bg-neutral-200"
              style={{ top: -8, right: 12 }}>
              <ThemedText className="text-xs font-semibold text-white dark:text-neutral-900">
                {state === 'soon'
                  ? formatHomeSpotlightCountdown(msUntilStart, locale)
                  : formatHomeBookingSlotLabel(booking)}
              </ThemedText>
            </View>
          ) : null}
          {state === 'soon' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                navSheetRef.current?.show();
              }}
              className="absolute flex-row items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 active:opacity-70 dark:bg-neutral-200"
              style={{ bottom: -10, right: 12 }}>
              <Icon name="Navigation" size={11} color={isDark ? '#171717' : '#ffffff'} />
              <ThemedText className="text-xs font-semibold text-white dark:text-neutral-900">
                Navigovat
              </ThemedText>
            </Pressable>
          )}
        </View>
      </Pressable>
      {state === 'soon' && (
        <ActionSheetThemed ref={navSheetRef} gestureEnabled>
          <View className="gap-3 px-4 pb-8 pt-2">
            <ThemedText className="mb-1 text-center text-base font-semibold">
              Navigovat do pobočky{booking.branch?.name ? ` ${booking.branch.name}` : ''}
            </ThemedText>
            {booking.branch?.address ? (
              <Pressable
                onPress={() => Clipboard.setString(booking.branch!.address!)}
                className="-mt-1 flex-row items-center justify-center gap-1 active:opacity-60">
                <ThemedText className="text-center text-xs text-light-subtext dark:text-dark-subtext">
                  {booking.branch.address}
                </ThemedText>
                <Icon name="Copy" size={12} className="text-light-subtext dark:text-dark-subtext" />
              </Pressable>
            ) : null}
            <Button
              title="Google Maps"
              onPress={() => openMaps('google')}
              variant="primary"
              iconStart="Map"
              style={{ backgroundColor: '#34A853' }}
            />
            <Button
              title="Waze"
              onPress={() => openMaps('waze')}
              variant="primary"
              iconStart="Navigation"
              style={{ backgroundColor: '#33CCFF' }}
            />
          </View>
        </ActionSheetThemed>
      )}
    </>
  );
}
