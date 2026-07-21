import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BarberAboutSectionProps {
  description: string | null;
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}

export default function BarberAboutSection({
  description,
  embedded = false,
  t,
}: BarberAboutSectionProps) {
  if (!description?.trim()) return null;

  const body = (
    <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
      {description}
    </ThemedText>
  );

  if (embedded) {
    return (
      <View className={BARBER_DETAIL_SECTION_SPACING}>
        <ThemedText className="mb-2 text-lg font-semibold">{t('barberAboutMe')}</ThemedText>
        {body}
      </View>
    );
  }

  return (
    <Section title={t('barberAboutMe')} titleSize="lg" className="mb-6 mt-8">
      <View className="mt-3">{body}</View>
    </Section>
  );
}
