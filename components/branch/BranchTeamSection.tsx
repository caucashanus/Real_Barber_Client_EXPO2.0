import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { BranchEmployee } from '@/api/branches';
import Avatar from '@/components/Avatar';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BranchTeamSectionProps {
  employees: BranchEmployee[];
  t: (key: TranslationKey) => string;
}

export default function BranchTeamSection({ employees, t }: BranchTeamSectionProps) {
  if (employees.length === 0) return null;

  return (
    <>
      <Divider className="mb-4 mt-4" />
      <Section title={t('branchTeam')} titleSize="lg" className="mb-6 mt-2">
        <View className="mt-3 flex-row flex-wrap gap-6">
          {employees.map((emp) => (
            <Pressable
              key={emp.id}
              onPress={() => router.push(`/screens/barber-detail?id=${emp.id}`)}
              className="items-center active:opacity-70">
              <Avatar size="lg" src={emp.avatarUrl ?? undefined} name={emp.name} />
              <ThemedText variant="bodySm" className="mt-2" numberOfLines={1}>
                {emp.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Section>
    </>
  );
}
