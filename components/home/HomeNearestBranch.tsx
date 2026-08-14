import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { Locale } from '@/contexts/LanguageContext';
import { BranchQuickSheet } from '@/components/branch/BranchQuickSheet';
import ThemedText from '@/components/ThemedText';
import { getBranchContactMeta } from '@/constants/branchContacts';
import { useNearestBranch } from '@/hooks/useNearestBranch';
import type { TranslationKey } from '@/locales';
import {
  buildNearestBranchSlotsByInternalId,
} from '@/utils/nearestBranchHomeSlots';
import { formatTravelDistanceMeters } from '@/utils/formatTravelDistanceMeters';
import { formatTravelDurationMinutes } from '@/utils/formatTravelDurationSeconds';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { interpolateTemplate } from '@/utils/profileShareLinks';

const TILE_IMAGE = require('@/assets/img/branches.png');

interface HomeNearestBranchProps {
  teamCards: HomeTodayTeamCardModel[];
  locale: Locale;
  t: (key: TranslationKey) => string;
  homeRefreshing?: boolean;
}

function buildNearestHomeDetails(
  nearest: NonNullable<ReturnType<typeof useNearestBranch>['nearest']>,
  branchLabel: string,
  locale: Locale,
  t: (key: TranslationKey) => string
): string {
  const parts: string[] = [branchLabel];

  const distanceMeters =
    nearest.drive?.distanceMeters ??
    nearest.bicycle?.distanceMeters ??
    nearest.walk?.distanceMeters ??
    null;

  if (distanceMeters != null) {
    parts.push(formatTravelDistanceMeters(distanceMeters, locale));
  }

  if (nearest.drive) {
    parts.push(
      interpolateTemplate(t('nearestBranchTravelDrive'), {
        minutes: String(formatTravelDurationMinutes(nearest.drive.durationSeconds)),
      })
    );
  }

  return parts.join(' · ');
}

export default function HomeNearestBranch({
  teamCards,
  locale,
  t,
  homeRefreshing = false,
}: HomeNearestBranchProps) {
  const sheetRef = useRef<ActionSheetRef>(null);
  const wasRefreshingRef = useRef(false);
  const {
    nearest,
    error,
    loading,
    userLocationLabel,
    prefetchNearest,
    resolveNearest,
  } = useNearestBranch();

  useEffect(() => {
    void prefetchNearest();
  }, [prefetchNearest]);

  useEffect(() => {
    if (homeRefreshing) {
      wasRefreshingRef.current = true;
      return;
    }
    if (wasRefreshingRef.current) {
      wasRefreshingRef.current = false;
      void prefetchNearest({ force: true });
    }
  }, [homeRefreshing, prefetchNearest]);

  const slotsByBranch = useMemo(
    () => buildNearestBranchSlotsByInternalId(teamCards, locale),
    [teamCards, locale]
  );

  const openSheet = useCallback(() => {
    sheetRef.current?.show();
    void resolveNearest();
  }, [resolveNearest]);

  const branchMeta = nearest ? getBranchContactMeta(nearest.id) : null;
  const showLiveTile = Boolean(nearest && !error);
  const showLoadingTile = loading && !nearest;
  const youLine = userLocationLabel
    ? interpolateTemplate(t('nearestBranchHomeYou'), { location: userLocationLabel })
    : t('nearestBranchHomeYouFallback');
  const nearestLine =
    nearest && branchMeta
      ? interpolateTemplate(t('nearestBranchHomeNearestLine'), {
          details: buildNearestHomeDetails(nearest, branchMeta.shortLabel, locale, t),
        })
      : '';
  const branchSlots = nearest ? slotsByBranch[nearest.id] : [];

  const errorMessage =
    error === 'denied'
      ? t('nearestBranchDenied')
      : error === 'unavailable'
        ? t('nearestBranchUnavailable')
        : error === 'failed'
          ? t('nearestBranchFailed')
          : null;

  return (
    <>
      <Pressable
        onPress={openSheet}
        className="mb-2 w-full rounded-2xl bg-light-secondary dark:bg-dark-secondary active:opacity-70">
        {showLoadingTile ? (
          <View className="gap-2 p-3.5">
            <View className="h-3 w-24 rounded-md bg-light-subtext/15 dark:bg-dark-subtext/15" />
            <View className="h-4 w-56 max-w-full rounded-md bg-light-subtext/15 dark:bg-dark-subtext/15" />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {t('nearestBranchLoading')}
            </ThemedText>
          </View>
        ) : showLiveTile ? (
          <View className="gap-1 p-3.5">
            <ThemedText
              className="text-xs leading-4 text-light-subtext dark:text-dark-subtext"
              numberOfLines={1}>
              {youLine}
            </ThemedText>
            <ThemedText className="text-sm font-semibold leading-5" numberOfLines={2}>
              {nearestLine}
            </ThemedText>
          </View>
        ) : (
          <View className="flex-row items-center gap-3 p-3.5">
            <Image source={TILE_IMAGE} style={{ width: 28, height: 28 }} contentFit="contain" />
            <ThemedText
              className="min-w-0 flex-1 text-sm font-semibold leading-tight"
              numberOfLines={2}>
              {t('nearestBranchCta')}
            </ThemedText>
          </View>
        )}
      </Pressable>

      <BranchQuickSheet
        ref={sheetRef}
        branchInternalId={nearest?.id ?? null}
        branchTravel={nearest}
        slots={branchSlots}
        locale={locale}
        t={t}
        loading={loading}
        errorMessage={errorMessage}
      />
    </>
  );
}
