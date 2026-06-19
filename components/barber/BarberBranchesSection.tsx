import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { EmployeeBranch } from '@/api/employees';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BarberBranchesSectionProps {
  branches: EmployeeBranch[];
  t: (key: TranslationKey) => string;
}

export default function BarberBranchesSection({ branches, t }: BarberBranchesSectionProps) {
  if (branches.length === 0) return null;

  return (
    <>
      <Divider className="mb-4 mt-8" />
      <Section title={t('barberBranches')} titleSize="lg" className="mb-6 mt-2">
        <View className="mt-3 gap-3">
          {branches.map((branch) => (
            <Pressable
              key={branch.id}
              onPress={() => router.push(`/screens/branch-detail?id=${branch.id}`)}
              className="flex-row items-center rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
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
                <ThemedText variant="body">{branch.name}</ThemedText>
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
      </Section>
    </>
  );
}
