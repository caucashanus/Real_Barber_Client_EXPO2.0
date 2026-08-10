import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import BranchAddress from '@/components/shared/BranchAddress';
import Section from '@/components/layout/Section';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { getBranchContactMeta } from '@/constants/branchContacts';
import { branchDetailHref } from '@/constants/profileDetailRoutes';
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
            <View key={branchId} className="flex-row items-start gap-3">
              <Pressable
                onPress={() => router.push(branchDetailHref(crmId) as never)}
                className="shrink-0 active:opacity-70">
                <Image
                  source={meta.carouselImage}
                  className="h-10 w-10 rounded-md"
                  contentFit="cover"
                />
              </Pressable>
              <View className="min-w-0 flex-1">
                <Pressable
                  onPress={() => router.push(branchDetailHref(crmId) as never)}
                  className="self-start active:opacity-70">
                  <ThemedText className="text-sm font-semibold">
                    Real Barber {meta.shortLabel}
                  </ThemedText>
                </Pressable>
                <BranchAddress
                  address={meta.address}
                  className="mt-0.5"
                  textClassName="text-xs leading-5 text-light-subtext dark:text-dark-subtext"
                  numberOfLines={2}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}
