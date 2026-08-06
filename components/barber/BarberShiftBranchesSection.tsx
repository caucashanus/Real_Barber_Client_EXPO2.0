import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { TeamMemberPageBranch } from '@/api/publicTeamMember';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { getTeamMemberBranchName, formatBranchAddressShort } from '@/utils/teamMemberPageHelpers';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import { branchDetailHref } from '@/constants/profileDetailRoutes';

interface BarberShiftBranchesSectionProps {
  branches: TeamMemberPageBranch[];
  locale: Locale;
  t: (key: TranslationKey) => string;
}

export default function BarberShiftBranchesSection({
  branches,
  locale,
  t,
}: BarberShiftBranchesSectionProps) {
  if (branches.length === 0) return null;

  return (
    <View className={`${BARBER_DETAIL_SECTION_SPACING} rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary`}>
      <ThemedText className="mb-3 text-lg font-semibold">
        {branches.length === 1 ? t('barberFindMeAtBranch') : t('barberFindMeAtBranches')}
      </ThemedText>
      <View className="gap-4">
        {branches.map((branch) => {
          const addressLabel = formatBranchAddressShort(branch.address);

          return (
          <Pressable
            key={branch.id}
            onPress={() => router.push(branchDetailHref(branch.id) as never)}
            className="flex-row items-center active:opacity-70">
            {branch.imageUrl ? (
              <Image
                source={{ uri: branch.imageUrl }}
                className="h-12 w-12 rounded-lg"
                contentFit="cover"
              />
            ) : (
              <View className="h-12 w-12 rounded-lg bg-light-primary dark:bg-dark-primary" />
            )}
            <View className="ml-3 flex-1">
              <ThemedText className="font-medium">
                {getTeamMemberBranchName(branch, locale)}
              </ThemedText>
              {addressLabel ? (
                <ThemedText
                  className="text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {addressLabel}
                </ThemedText>
              ) : null}
            </View>
            <Icon name="ChevronRight" size={20} className="opacity-60" />
          </Pressable>
          );
        })}
      </View>
    </View>
  );
}
