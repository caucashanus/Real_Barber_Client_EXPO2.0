import React from 'react';
import { View } from 'react-native';

import Avatar from '@/components/Avatar';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BarberAboutSectionProps {
  avatarUrl?: string | null;
  name: string;
  description: string | null;
  t: (key: TranslationKey) => string;
}

export default function BarberAboutSection({
  avatarUrl,
  name,
  description,
  t,
}: BarberAboutSectionProps) {
  return (
    <View className="mb-8 mt-8 border-y border-neutral-200 py-global dark:border-dark-secondary">
      <View className="mb-3 flex-row items-center">
        <Avatar size="md" src={avatarUrl ?? undefined} name={name} className="mr-4" />
        <ThemedText variant="emphasis">{t('barberAboutMe')}</ThemedText>
      </View>
      {description ? (
        <ThemedText
          className="text-sm text-light-subtext dark:text-dark-subtext"
          style={{ lineHeight: 22 }}>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}
