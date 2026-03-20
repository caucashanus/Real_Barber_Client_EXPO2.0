import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import CurrentBookingCard from '@/components/booking/CurrentBookingCard';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getBookingById, updateBooking, type Booking } from '@/api/bookings';

function formatDateLabel(date: string, locale: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function RescheduleSummaryScreen() {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const { id, date, slotStart, slotEnd, duration } = useLocalSearchParams<{
    id?: string;
    date?: string;
    slotStart?: string;
    slotEnd?: string;
    duration?: string;
  }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      setFetchError(t('rescheduleNotFound'));
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getBookingById(apiToken, id)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setFetchError(t('rescheduleNotFound'));
          return;
        }
        setBooking(found);
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : t('rescheduleLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, id, t]);

  const nextDuration = useMemo(() => {
    const parsed = Number(duration ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [duration]);

  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const nextDateLabel = formatDateLabel(String(date ?? ''), dateLocaleTag);

  const onConfirm = useCallback(async () => {
    if (!apiToken || !booking || !date || !slotStart || !slotEnd) {
      setSubmitError(t('rescheduleNoSlot'));
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      await updateBooking(apiToken, booking.id, {
        date,
        slotStart,
        slotEnd,
      });
      router.replace('/trips');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [apiToken, booking, date, slotEnd, slotStart, t]);

  if (loading) {
    return (
      <>
        <Header title={t('rescheduleSummaryTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (!booking || fetchError) {
    return (
      <>
        <Header title={t('rescheduleSummaryTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{fetchError ?? t('rescheduleNotFound')}</ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title={t('rescheduleSummaryTitle')} showBackButton />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ScrollView className="flex-1 px-global pt-2" showsVerticalScrollIndicator={false}>
          <Divider className="mt-2 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('rescheduleCurrentTitle')} titleSize="lg" className="pt-3 pb-1">
            <CurrentBookingCard booking={booking} />
          </Section>

          <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('reschedulePickTitle')} titleSize="lg" className="pt-3 pb-1">
            <ThemedText className="text-base font-semibold mt-2">{nextDateLabel}</ThemedText>
            <View className="flex-row items-center justify-between bg-light-secondary dark:bg-dark-secondary rounded-xl p-3 mt-2">
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{t('reservationSummaryFrom')}</ThemedText>
                <ThemedText className="text-base font-semibold">{slotStart}</ThemedText>
              </View>
              <View className="items-end">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{t('reservationSummaryTo')}</ThemedText>
                <ThemedText className="text-base font-semibold">{slotEnd}</ThemedText>
              </View>
            </View>
            {nextDuration > 0 ? (
              <View className="flex-row items-center justify-between pt-2.5">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {t('reservationSummaryEstimatedDuration')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{nextDuration} min</ThemedText>
              </View>
            ) : null}
          </Section>

          {submitError ? <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{submitError}</ThemedText> : null}
          <View className="h-8" />
        </ScrollView>

        <ThemedFooter>
          <View className="flex-row rounded-2xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
            <Button
              variant="primary"
              size="small"
              rounded="none"
              title={t('rescheduleConfirm')}
              loading={saving}
              onPress={() => {
                void onConfirm();
              }}
              disabled={saving}
              className="w-full flex-1 py-3.5 px-0 min-w-0 rounded-none"
              textClassName="text-sm font-semibold text-white"
              style={{ backgroundColor: colors.highlight }}
            />
          </View>
        </ThemedFooter>
      </View>
    </>
  );
}
