import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { BranchEmployee } from '@/api/branches';
import Avatar from '@/components/Avatar';
import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ThemedText from '@/components/ThemedText';
import { barberDetailHref } from '@/constants/profileDetailRoutes';
import type { TranslationKey } from '@/locales';

interface BranchTeamSectionProps {
  employees: BranchEmployee[];
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
  titleKey?: TranslationKey;
}

export default function BranchTeamSection({
  employees,
  t,
  isFirst,
  titleKey = 'branchTeam',
}: BranchTeamSectionProps) {
  if (employees.length === 0) return null;

  return (
    <BranchContentCardSection title={t(titleKey)} isFirst={isFirst}>
      <View className="flex-row flex-wrap gap-6">
        {employees.map((emp) => (
          <Pressable
            key={emp.id}
            onPress={() => router.push(barberDetailHref(emp.id) as never)}
            className="items-center active:opacity-70">
            <Avatar size="lg" src={emp.avatarUrl ?? undefined} name={emp.name} />
            <ThemedText className="mt-2 text-sm font-medium" numberOfLines={1}>
              {emp.name}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </BranchContentCardSection>
  );
}
