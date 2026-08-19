import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { EmployeeBranch } from '@/api/employees';
import Icon from '@/components/Icon';
import BranchAddress from '@/components/shared/BranchAddress';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { branchDetailHref } from '@/constants/profileDetailRoutes';
import type { TranslationKey } from '@/locales';

interface BarberBranchesSectionProps {
  branches: EmployeeBranch[];
  t: (key: TranslationKey) => string;
}

export default function BarberBranchesSection({ branches, t }: BarberBranchesSectionProps) {
  if (branches.length === 0) return null;

  return (
    <Section title={t('barberBranches')} titleSize="lg" className="mb-6 mt-8">
      <View className="mt-3 gap-3">
        {branches.map((branch) => (
          <View
            key={branch.id}
            className="flex-row items-start rounded-xl bg-light-surface p-3 dark:bg-dark-secondary">
            <Pressable
              onPress={() => router.push(branchDetailHref(branch.id) as never)}
              className="shrink-0 active:opacity-70">
              {branch.imageUrl ? (
                <Image
                  source={{ uri: branch.imageUrl }}
                  className="h-12 w-12 rounded-lg"
                  contentFit="cover"
                />
              ) : (
                <View className="h-12 w-12 rounded-lg bg-light-primary dark:bg-dark-primary" />
              )}
            </Pressable>
            <View className="ml-3 min-w-0 flex-1">
              <Pressable
                onPress={() => router.push(branchDetailHref(branch.id) as never)}
                className="self-start active:opacity-70">
                <ThemedText className="font-medium">{branch.name}</ThemedText>
              </Pressable>
              <BranchAddress address={branch.address} className="mt-1" numberOfLines={1} />
            </View>
            <Pressable
              onPress={() => router.push(branchDetailHref(branch.id) as never)}
              className="shrink-0 self-center active:opacity-70">
              <Icon name="ChevronRight" size={20} className="opacity-60" />
            </Pressable>
          </View>
        ))}
      </View>
    </Section>
  );
}
