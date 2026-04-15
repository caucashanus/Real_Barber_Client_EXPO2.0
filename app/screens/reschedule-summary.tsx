import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image } from 'react-native';

import { getBookingById, updateBooking, type Booking } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedText from '@/components/ThemedText';
import CurrentBookingCard from '@/components/booking/CurrentBookingCard';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import { rbLiveActivityUpdateForBooking } from '@/lib/rb-live-activity';

const RB_RESCHEDULE_HINT_KEY = 'rb_live_activity_reschedule_hint_v1';

type RescheduleHint = {
  bookingId: string;
  startAt: string;
  endAt: string;
  ts: number;
  branchName: string;
  employeeName: string;
  employeeAvatarUrl: string;
  price: number | null;
  detailLine: string;
};

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
      // Hint for immediate foreground reconcile without requiring Trips refresh.
      const startIso = new Date(`${date}T${slotStart}:00`).toISOString();
      const endIso = new Date(`${date}T${slotEnd}:00`).toISOString();
      const hint: RescheduleHint = {
        bookingId: booking.id,
        startAt: startIso,
        endAt: endIso,
        ts: Date.now(),
        branchName: booking.branch?.name ?? '',
        employeeName: booking.employee?.name ?? '',
        employeeAvatarUrl: booking.employee?.avatarUrl ?? '',
        price: Number.isFinite(Number(booking.price)) ? Number(booking.price) : null,
        detailLine: `${slotStart}–${slotEnd}`,
      };
      AsyncStorage.setItem(RB_RESCHEDULE_HINT_KEY, JSON.stringify(hint)).catch(() => undefined);
      // Immediate local lock-screen feedback: show "changed" state even when server won't send remote updates.
      await rbLiveActivityUpdateForBooking(booking.id, {
        subtitle: 'Váš termín se změnil',
        title: 'Otevřete aplikaci pro detail',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        branchName: '',
        detailLine: '',
        employeeName: '',
        employeeAvatarUrl: '',
        employeeAvatarAuthToken: '',
        progress01: -1,
        accentHex: '',
        priceFormatted: '',
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
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (!booking || fetchError) {
    return (
      <>
        <Header title={t('rescheduleSummaryTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {fetchError ?? t('rescheduleNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title={t('rescheduleSummaryTitle')} showBackButton />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ScrollView className="flex-1 px-global pt-2" showsVerticalScrollIndicator={false}>
          <View className="mb-4 items-center pt-2">
            <Image
              source={require('@/assets/img/reschedule-confirm.png')}
              className="h-20 w-20"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Divider className="mt-2 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('rescheduleCurrentTitle')} titleSize="lg" className="pb-1 pt-3">
            <CurrentBookingCard booking={booking} />
          </Section>

          <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('reschedulePickTitle')} titleSize="lg" className="pb-1 pt-3">
            <ThemedText className="mt-2 text-base font-semibold">{nextDateLabel}</ThemedText>
            <View className="mt-2 flex-row items-center justify-between rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {t('reservationSummaryFrom')}
                </ThemedText>
                <ThemedText className="text-base font-semibold">{slotStart}</ThemedText>
              </View>
              <View className="items-end">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {t('reservationSummaryTo')}
                </ThemedText>
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

          {submitError ? (
            <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">
              {submitError}
            </ThemedText>
          ) : null}
          <View className="h-8" />
        </ScrollView>

        <ThemedFooter>
          <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
            <Button
              variant="primary"
              size="small"
              rounded="none"
              title={t('rescheduleConfirm')}
              loading={saving}
              onPress={() => {
                onConfirm().catch(() => undefined);
              }}
              disabled={saving}
              className="w-full min-w-0 flex-1 rounded-none px-0 py-3.5"
              textClassName="text-sm font-semibold text-white"
              style={{ backgroundColor: colors.highlight }}
            />
          </View>
        </ThemedFooter>
      </View>
    </>
  );
}
