import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { TeamMemberPageEmployee } from '@/api/publicTeamMember';
import type { Locale } from '@/app/contexts/LanguageContext';
import { AccentChip } from '@/components/AccentChip';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { pickTeamMemberLocalizedField } from '@/utils/teamMemberPageHelpers';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BarberSkillsSectionProps {
  employee: TeamMemberPageEmployee;
  locale: Locale;
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}

function collectFavoritePills(employee: TeamMemberPageEmployee, locale: Locale) {
  const pills: { key: string; label: string }[] = [];

  for (const label of Object.keys(employee.hairstyleSkills ?? {})) {
    const trimmed = label.trim();
    if (trimmed) pills.push({ key: `hairstyle-${trimmed}`, label: trimmed });
  }

  for (const label of Object.keys(employee.coloringSkills ?? {})) {
    const trimmed = label.trim();
    if (trimmed) pills.push({ key: `coloring-${trimmed}`, label: trimmed });
  }

  for (const service of employee.favoriteServices ?? []) {
    const name = pickTeamMemberLocalizedField(service, 'name', locale) ?? service.name;
    const trimmed = name?.trim();
    if (trimmed) pills.push({ key: `service-${service.id}`, label: trimmed });
  }

  return pills;
}

export default function BarberSkillsSection({
  employee,
  locale,
  embedded = false,
  t,
}: BarberSkillsSectionProps) {
  const pills = useMemo(() => collectFavoritePills(employee, locale), [employee, locale]);
  const sectionTitle = embedded ? t('barberMyFavorites') : t('barberSkills');

  if (pills.length === 0) return null;

  const content = (
    <View className={`flex-row flex-wrap gap-2 ${embedded ? '' : 'mt-3'}`}>
      {pills.map((pill) => (
        <AccentChip key={pill.key} label={pill.label} size="md" rounded="full" />
      ))}
    </View>
  );

  if (embedded) {
    return (
      <View className={BARBER_DETAIL_SECTION_SPACING}>
        <ThemedText className="mb-3 text-lg font-semibold">{sectionTitle}</ThemedText>
        {content}
      </View>
    );
  }

  return (
    <Section title={sectionTitle} titleSize="lg" className="mb-6 mt-8">
      {content}
    </Section>
  );
}
