import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { getBranchContactMeta } from '@/constants/branchContacts';
import {
  resolveCrmBranchId,
  type BranchInternalId,
} from '@/constants/crmBranchIds';
import type { TranslationKey } from '@/locales';

const BRANCH_ORDER: BranchInternalId[] = ['barrandov', 'hagibor', 'kacerov', 'modrany'];

interface BranchOtherBranchesProps {
  currentInternalId?: BranchInternalId;
  t: (key: TranslationKey) => string;
}

export default function BranchOtherBranches({
  currentInternalId,
  t,
}: BranchOtherBranchesProps) {
  const others = BRANCH_ORDER.filter((id) => id !== currentInternalId);
  if (others.length === 0) return null;

  return (
    <Section
      title={t('branchOtherBranchesTitle')}
      titleSize="lg"
      className={BARBER_DETAIL_SECTION_SPACING}>
      <View className="gap-4">
        {others.map((branchId) => {
          const meta = getBranchContactMeta(branchId);
          const crmId = resolveCrmBranchId(branchId);
          return (
            <Pressable
              key={branchId}
              onPress={() =>
                router.push(`/screens/branch-detail?id=${encodeURIComponent(crmId)}` as never)
              }
              className="flex-row items-center gap-3 active:opacity-70">
              <Image
                source={meta.carouselImage}
                className="h-10 w-10 rounded-md"
                contentFit="cover"
              />
              <View className="min-w-0 flex-1">
                <ThemedText className="text-sm font-semibold">Real Barber {meta.shortLabel}</ThemedText>
                <ThemedText
                  className="text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={2}>
                  {meta.address}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}
