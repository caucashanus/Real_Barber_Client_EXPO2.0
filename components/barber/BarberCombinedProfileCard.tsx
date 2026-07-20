import React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import type {
  TeamMemberMediaItem,
  TeamMemberPageBranch,
  TeamMemberPageEmployee,
  TeamMemberShiftDay,
} from '@/api/publicTeamMember';
import type { Locale } from '@/app/contexts/LanguageContext';
import BarberAboutSection from '@/components/barber/BarberAboutSection';
import BarberAvailabilitySection from '@/components/barber/BarberAvailabilitySection';
import BarberSkillsSection from '@/components/barber/BarberSkillsSection';
import BarberWorkSamplesSection from '@/components/barber/BarberWorkSamplesSection';
import type { TranslationKey } from '@/locales';

interface BarberCombinedProfileCardProps {
  employee: TeamMemberPageEmployee;
  employeeId: string;
  bio: string | null;
  showAbout: boolean;
  showSkills: boolean;
  showMedia: boolean;
  mediaItems: TeamMemberMediaItem[];
  shiftCalendar: TeamMemberShiftDay[] | undefined;
  branches: TeamMemberPageBranch[];
  today: string;
  locale: Locale;
  calendarConfigured: boolean;
  onMediaPress: (item: TeamMemberMediaItem) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onAvailabilityLayout?: (event: LayoutChangeEvent) => void;
  onCollapseScroll?: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberCombinedProfileCard({
  employee,
  employeeId,
  bio,
  showAbout,
  showSkills,
  showMedia,
  mediaItems,
  shiftCalendar,
  branches,
  today,
  locale,
  calendarConfigured,
  onMediaPress,
  onLayout,
  onAvailabilityLayout,
  onCollapseScroll,
  t,
}: BarberCombinedProfileCardProps) {
  const hasContent = showAbout || showSkills || showMedia || true;

  if (!hasContent) return null;

  return (
    <View
      onLayout={onLayout}
      nativeID="dostupnost"
      className="mb-6 mt-8 rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary">
      {showAbout ? <BarberAboutSection description={bio} embedded t={t} /> : null}

      {showSkills ? (
        <BarberSkillsSection employee={employee} locale={locale} embedded t={t} />
      ) : null}

      {showMedia ? (
        <BarberWorkSamplesSection
          media={mediaItems}
          onMediaPress={onMediaPress}
          embedded
          t={t}
        />
      ) : null}

      <BarberAvailabilitySection
        employeeId={employeeId}
        shiftCalendar={shiftCalendar}
        branches={branches}
        today={today}
        locale={locale}
        calendarConfigured={calendarConfigured}
        embedded
        onLayout={onAvailabilityLayout}
        onCollapseScroll={onCollapseScroll}
        t={t}
      />
    </View>
  );
}
