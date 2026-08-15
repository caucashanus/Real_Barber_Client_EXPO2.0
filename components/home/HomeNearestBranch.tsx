import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { Locale } from '@/contexts/LanguageContext';
import { BranchQuickSheet } from '@/components/branch/BranchQuickSheet';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { useNearestBranch } from '@/hooks/useNearestBranch';
import type { TranslationKey } from '@/locales';
import { buildNearestBranchSlotsByInternalId } from '@/utils/nearestBranchHomeSlots';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';

const TILE_IMAGE = require('@/assets/img/branches.png');

interface HomeNearestBranchProps {
  teamCards: HomeTodayTeamCardModel[];
  locale: Locale;
  t: (key: TranslationKey) => string;
}

export default function HomeNearestBranch({ teamCards, locale, t }: HomeNearestBranchProps) {
  const sheetRef = useRef<ActionSheetRef>(null);
  const { nearest, error, loading, resolveNearest, resetSession } = useNearestBranch();

  const slotsByBranch = useMemo(
    () => buildNearestBranchSlotsByInternalId(teamCards, locale),
    [teamCards, locale]
  );

  const openSheet = useCallback(() => {
    sheetRef.current?.show();
    void resolveNearest();
  }, [resolveNearest]);

  const handleSheetClose = useCallback(() => {
    resetSession();
  }, [resetSession]);

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
      <Pressable onPress={openSheet} className="mb-2 w-[48.7%] active:opacity-70">
        <SurfaceCard rounded="2xl" className="w-full">
          <View className="flex-row items-center gap-3 p-3.5">
            <Image source={TILE_IMAGE} style={{ width: 28, height: 28 }} contentFit="contain" />
            <ThemedText
              className="min-w-0 flex-1 text-sm font-semibold leading-tight"
              numberOfLines={2}>
              {t('nearestBranchCta')}
            </ThemedText>
          </View>
        </SurfaceCard>
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
        onClose={handleSheetClose}
      />
    </>
  );
}
