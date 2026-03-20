import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import Section from '@/components/layout/Section';
import { Chip } from '@/components/Chip';
import Icon from '@/components/Icon';
import CurrentBookingCard from '@/components/booking/CurrentBookingCard';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import {
  getBookingById,
  getBookingAvailability,
  type Booking,
  type BookingAvailabilityResponse,
} from '@/api/bookings';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthDays(offset: number, dateLocale: string): Array<{ value: string; label: string }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const out: Array<{ value: string; label: string }> = [];
  for (let day = 1; day <= last.getDate(); day += 1) {
    const dt = new Date(first.getFullYear(), first.getMonth(), day);
    if (dt < new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue;
    out.push({
      value: toIsoDate(dt),
      label: dt.toLocaleDateString(dateLocale, { weekday: 'short', day: '2-digit' }),
    });
  }
  return out;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function getMonthOffsetFromToday(target: Date): number {
  const now = new Date();
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

export default function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const colors = useThemeColors();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [duration, setDuration] = useState(0);
  const initialRef = useRef<{ date: string; slotStart: string; slotEnd: string } | null>(null);

  const [monthOffset, setMonthOffset] = useState(0);
  const [availableDatesInMonth, setAvailableDatesInMonth] = useState<Set<string>>(new Set());
  const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false);

  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoadingBooking(false);
      setFetchError(!apiToken ? t('commonError') : t('rescheduleNotFound'));
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    setFetchError(null);
    getBookingById(apiToken, id)
      .then((found) => {
        if (cancelled) return;
        setBooking(found);
        if (!found) setFetchError(t('rescheduleNotFound'));
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : t('rescheduleLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, id, t]);

  useEffect(() => {
    if (!booking) return;
    const d = (booking.date || '').slice(0, 10);
    if (!d) return;
    setDate(d);
    setSlotStart(booking.slotStart || '');
    setSlotEnd(booking.slotEnd || '');
    setDuration(booking.duration ?? 0);
    setMonthOffset(Math.max(0, getMonthOffsetFromToday(new Date(d))));
    initialRef.current = {
      date: d,
      slotStart: booking.slotStart || '',
      slotEnd: booking.slotEnd || '',
    };
  }, [booking]);

  const monthDays = useMemo(() => getMonthDays(monthOffset, dateLocaleTag), [monthOffset, dateLocaleTag]);
  const visibleMonthDays = useMemo(
    () => monthDays.filter((day) => availableDatesInMonth.has(day.value)),
    [monthDays, availableDatesInMonth]
  );
  const monthLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    const txt = d.toLocaleDateString(dateLocaleTag, { month: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }, [monthOffset, dateLocaleTag]);

  const groupedSlots = useMemo(() => {
    const slots = availability?.availability?.slots ?? [];
    const morning = slots.filter((s) => timeToMinutes(s.start) < 12 * 60);
    const afternoon = slots.filter((s) => timeToMinutes(s.start) >= 12 * 60 && timeToMinutes(s.start) < 17 * 60);
    const evening = slots.filter((s) => timeToMinutes(s.start) >= 17 * 60);
    return { morning, afternoon, evening };
  }, [availability]);

  const employeeId = booking?.employeeId ?? '';
  const branchId = booking?.branchId ?? '';
  const itemId = booking?.itemId ?? '';

  useEffect(() => {
    if (!apiToken || !employeeId || !date) {
      setAvailability(null);
      setAvailabilityError(null);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);
    setAvailabilityError(null);
    getBookingAvailability(apiToken, {
      employeeId,
      date,
      branchId: branchId || undefined,
      itemId: itemId || undefined,
    })
      .then((res) => {
        if (!cancelled) setAvailability(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(e instanceof Error ? e.message : t('bookingLoadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, employeeId, date, branchId, itemId, t]);

  useEffect(() => {
    if (!apiToken || !employeeId || monthDays.length === 0) {
      setAvailableDatesInMonth(new Set());
      setLoadingMonthAvailability(false);
      return;
    }
    let cancelled = false;
    setLoadingMonthAvailability(true);
    Promise.all(
      monthDays.map(async (day) => {
        try {
          const res = await getBookingAvailability(apiToken, {
            employeeId,
            date: day.value,
            branchId: branchId || undefined,
            itemId: itemId || undefined,
          });
          const count = res?.availability?.slots?.length ?? 0;
          return count > 0 ? day.value : null;
        } catch {
          return null;
        }
      })
    )
      .then((values) => {
        if (cancelled) return;
        const available = values.filter((v): v is string => v != null).sort();
        setAvailableDatesInMonth(new Set(available));
      })
      .finally(() => {
        if (!cancelled) setLoadingMonthAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, employeeId, branchId, itemId, monthDays]);

  const selectDate = useCallback((dateValue: string) => {
    setDate(dateValue);
    setSlotStart('');
    setSlotEnd('');
    setDuration(0);
  }, []);

  const dirty = useMemo(() => {
    const init = initialRef.current;
    if (!init) return false;
    return date !== init.date || slotStart !== init.slotStart || slotEnd !== init.slotEnd;
  }, [date, slotStart, slotEnd]);

  const canSave = dirty && Boolean(slotStart && slotEnd && booking);

  const onContinueToSummary = useCallback(() => {
    if (!booking || !initialRef.current) return;
    if (!dirty) {
      setSaveError(t('rescheduleNoChange'));
      return;
    }
    if (!slotStart || !slotEnd) {
      setSaveError(t('rescheduleNoSlot'));
      return;
    }
    setSaveError(null);
    router.push(
      `/screens/reschedule-summary?id=${encodeURIComponent(booking.id)}&date=${encodeURIComponent(date)}&slotStart=${encodeURIComponent(slotStart)}&slotEnd=${encodeURIComponent(slotEnd)}&duration=${encodeURIComponent(String(duration || 0))}`
    );
  }, [booking, date, dirty, duration, slotEnd, slotStart, t]);

  if (loadingBooking) {
    return (
      <>
        <Header title={t('rescheduleTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (fetchError || !booking) {
    return (
      <>
        <Header title={t('rescheduleTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{fetchError ?? t('rescheduleNotFound')}</ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title={t('rescheduleTitle')} showBackButton />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ScrollView className="flex-1 px-global pt-4" keyboardShouldPersistTaps="handled">
          <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mb-4">{t('rescheduleIntro')}</ThemedText>

          <Section title={t('rescheduleCurrentTitle')} titleSize="lg" className="mb-4">
            <CurrentBookingCard booking={booking} />
          </Section>

          <Section title={t('reschedulePickTitle')} titleSize="lg" className="mb-4">
            <View className="mb-3 mt-2 flex-row items-center justify-between">
              <Pressable
                disabled={monthOffset === 0}
                onPress={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
                className={`rounded-full p-2 ${monthOffset === 0 ? 'opacity-40' : 'opacity-100'}`}
              >
                <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
              </Pressable>
              <ThemedText className="text-base font-semibold">{monthLabel}</ThemedText>
              <Pressable onPress={() => setMonthOffset((prev) => prev + 1)} className="rounded-full p-2">
                <Icon name="ChevronRight" size={24} className="translate-x-px" />
              </Pressable>
            </View>
            {loadingMonthAvailability ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {visibleMonthDays.map((day) => (
                <Chip
                  key={day.value}
                  size="lg"
                  label={day.label}
                  isSelected={date === day.value}
                  onPress={() => selectDate(day.value)}
                />
              ))}
            </View>
            {!loadingMonthAvailability && visibleMonthDays.length === 0 ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">
                {t('reservationNoSlotsMonth')}
              </ThemedText>
            ) : null}

            <View className="mt-6 mb-2">
              <ThemedText className="text-lg font-semibold">{t('reservationAvailableTimes')}</ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationAvailableTimesSubtitle')}
              </ThemedText>
            </View>
            {loadingAvailability ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : availabilityError ? (
              <ThemedText className="text-red-500">{availabilityError}</ThemedText>
            ) : (
              <>
                {groupedSlots.morning.length > 0 ? (
                  <Section title={t('reservationMorning')} titleSize="md" className="mb-2">
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      {groupedSlots.morning.map((slot, index) => (
                        <Chip
                          key={`m-${slot.start}-${slot.end}-${index}`}
                          size="lg"
                          label={slot.start}
                          isSelected={slotStart === slot.start && slotEnd === slot.end}
                          onPress={() => {
                            setSlotStart(slot.start);
                            setSlotEnd(slot.end);
                            setDuration(slot.duration);
                          }}
                        />
                      ))}
                    </View>
                  </Section>
                ) : null}
                {groupedSlots.afternoon.length > 0 ? (
                  <Section title={t('reservationAfternoon')} titleSize="md" className="mb-2">
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      {groupedSlots.afternoon.map((slot, index) => (
                        <Chip
                          key={`a-${slot.start}-${slot.end}-${index}`}
                          size="lg"
                          label={slot.start}
                          isSelected={slotStart === slot.start && slotEnd === slot.end}
                          onPress={() => {
                            setSlotStart(slot.start);
                            setSlotEnd(slot.end);
                            setDuration(slot.duration);
                          }}
                        />
                      ))}
                    </View>
                  </Section>
                ) : null}
                {groupedSlots.evening.length > 0 ? (
                  <Section title={t('reservationEvening')} titleSize="md" className="mb-2">
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      {groupedSlots.evening.map((slot, index) => (
                        <Chip
                          key={`e-${slot.start}-${slot.end}-${index}`}
                          size="lg"
                          label={slot.start}
                          isSelected={slotStart === slot.start && slotEnd === slot.end}
                          onPress={() => {
                            setSlotStart(slot.start);
                            setSlotEnd(slot.end);
                            setDuration(slot.duration);
                          }}
                        />
                      ))}
                    </View>
                  </Section>
                ) : null}
                {(availability?.availability?.slots?.length ?? 0) === 0 ? (
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('reservationNoSlotsSelection')}
                  </ThemedText>
                ) : null}
              </>
            )}
            {duration > 0 ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-3">
                {t('reservationSummaryEstimatedDuration')}: {duration} {t('bookingMinutesShort')}
              </ThemedText>
            ) : null}
          </Section>

          {saveError ? (
            <ThemedText className="text-sm text-red-500 dark:text-red-400 mb-4">{saveError}</ThemedText>
          ) : null}
          <View className="h-8" />
        </ScrollView>

        <ThemedFooter>
          <View className="flex-row rounded-2xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
            <Button
              variant={canSave ? 'primary' : 'ghost'}
              size="small"
              rounded="none"
              title={t('rescheduleContinue')}
              onPress={() => {
                onContinueToSummary();
              }}
              className={`w-full flex-1 py-3.5 px-0 min-w-0 rounded-none ${!canSave ? 'opacity-60' : ''}`}
              textClassName={
                canSave
                  ? 'text-sm font-semibold text-white'
                  : 'text-sm font-semibold text-neutral-800 dark:text-neutral-200'
              }
              style={canSave ? { backgroundColor: colors.highlight } : undefined}
            />
          </View>
        </ThemedFooter>
      </View>
    </>
  );
}
