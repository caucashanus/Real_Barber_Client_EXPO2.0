import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { TeamMemberPageBranch } from '@/api/publicTeamMember';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { Locale } from '@/app/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { getTeamMemberBranchName } from '@/utils/teamMemberPageHelpers';

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
    <View className="mb-6 mt-8 rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary">
      <ThemedText className="mb-3 text-lg font-semibold">
        {branches.length === 1 ? t('barberFindMeAtBranch') : t('barberFindMeAtBranches')}
      </ThemedText>
      <View className="gap-3">
        {branches.map((branch) => (
          <Pressable
            key={branch.id}
            onPress={() => router.push(`/screens/branch-detail?id=${branch.id}`)}
            className="flex-row items-center rounded-xl bg-light-primary p-3 dark:bg-dark-primary">
            {branch.imageUrl ? (
              <Image
                source={{ uri: branch.imageUrl }}
                className="h-12 w-12 rounded-lg"
                contentFit="cover"
              />
            ) : (
              <View className="h-12 w-12 rounded-lg bg-light-secondary dark:bg-dark-secondary" />
            )}
            <View className="ml-3 flex-1">
              <ThemedText className="font-medium">
                {getTeamMemberBranchName(branch, locale)}
              </ThemedText>
              {branch.address ? (
                <ThemedText
                  className="text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {branch.address}
                </ThemedText>
              ) : null}
            </View>
            <Icon name="ChevronRight" size={20} className="opacity-60" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
