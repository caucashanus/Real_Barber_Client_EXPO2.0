import React, { useMemo, useState } from 'react';

import { useBarbersRoster } from '@/app/hooks/useBarbersRoster';
import { useTranslation } from '@/app/hooks/useTranslation';
import { CardScroller } from '@/components/CardScroller';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import Header from '@/components/Header';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';

export default function ScheduleScreen() {
  const { t, locale } = useTranslation();
  const {
    scheduleDayTabs,
    scheduleCardsByDate,
    todayIso,
    loading,
    refreshing,
    error,
  } = useBarbersRoster(7);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (scheduleDayTabs.length > 0) return scheduleDayTabs[0]!.date;
    return todayIso;
  }, [scheduleDayTabs, selectedDate, todayIso]);

  const cards = scheduleCardsByDate[activeDate] ?? [];

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section
          title={t('scheduleTitle')}
          titleSize="3xl"
          className="px-4 pb-10 pt-4"
        />

        {!loading && !error && scheduleDayTabs.length > 0 ? (
          <CardScroller className="mb-4">
            {scheduleDayTabs.map((tab) => (
              <SlotTimePill
                key={tab.date}
                spaced
                title={tab.label}
                selected={tab.date === activeDate}
                onPress={() => setSelectedDate(tab.date)}
              />
            ))}
          </CardScroller>
        ) : null}

        <HomeTodayTeamSection
          contentOnly
          cards={cards}
          loading={loading}
          refreshingAvailability={refreshing}
          error={error}
          locale={locale}
          t={t}
          loadingTextKey="teamPageLoading"
          errorTextKey="teamPageLoadError"
          emptyTextKey="scheduleEmpty"
        />
      </ThemedScroller>
    </>
  );
}
