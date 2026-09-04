import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { useAccentColor } from '@/contexts/AccentColorContext';
import { useBarbersRoster } from '@/hooks/useBarbersRoster';
import { useTranslation } from '@/hooks/useTranslation';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import Header from '@/components/Header';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';

export default function ScheduleScreen() {
  const { t, locale } = useTranslation();
  const { accentColor } = useAccentColor();
  const {
    scheduleDayTabs,
    scheduleCardsByDate,
    todayIso,
    loading,
    refreshing,
    error,
    refresh,
  } = useBarbersRoster(7);

  const { date } = useLocalSearchParams<{ date?: string | string[] }>();
  const dateParam = useMemo(() => {
    const raw = Array.isArray(date) ? date[0] : date;
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
  }, [date]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateParam) setSelectedDate(dateParam);
  }, [dateParam]);

  const activeDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (scheduleDayTabs.length > 0) return scheduleDayTabs[0]!.date;
    return todayIso;
  }, [scheduleDayTabs, selectedDate, todayIso]);

  const cards = scheduleCardsByDate[activeDate] ?? [];

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />
        }>
        <Section
          title={t('scheduleTitle')}
          titleSize="3xl"
          className="px-4 pb-10 pt-4"
        />

        {!loading && !error && scheduleDayTabs.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap">
            {scheduleDayTabs.map((tab) => (
              <SlotTimePill
                key={tab.date}
                spaced
                title={tab.label}
                selected={tab.date === activeDate}
                onPress={() => setSelectedDate(tab.date)}
              />
            ))}
          </View>
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
