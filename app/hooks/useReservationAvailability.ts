import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ReservationFlowDataState,
  ReservationMonthState,
} from './reservationCreateFlowShared';

import { fetchAvailableDatesInMonth, getBookingAvailability, type BookingAvailabilityResponse } from '@/api/bookings';
import { dedupeAvailabilitySlots } from '@/utils/availabilitySlots';
import {
  type AvailabilitySlot,
  getMonthDays,
  getMonthKeyFromDate,
  timeToMinutes,
  toIsoDate,
} from '@/utils/reservationCreateHelpers';

interface UseReservationAvailabilityParams extends ReservationFlowDataState, ReservationMonthState {
  apiToken: string | null;
  dateLocaleTag: string;
}

export function useReservationAvailability({
  apiToken,
  data,
  setData,
  monthOffset,
  setMonthOffset,
  lastSelectedDateByMonth,
  setLastSelectedDateByMonth,
  dateLocaleTag,
}: UseReservationAvailabilityParams) {
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availableDatesInMonth, setAvailableDatesInMonth] = useState<Set<string>>(new Set());
  const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false);
  const emptyMonthAdvanceKeyRef = useRef<string | null>(null);

  const groupedSlots = useMemo(() => {
    const slots = dedupeAvailabilitySlots(availability?.availability?.slots ?? []);
    const morning = slots.filter((s) => timeToMinutes(s.start) < 12 * 60);
    const afternoon = slots.filter(
      (s) => timeToMinutes(s.start) >= 12 * 60 && timeToMinutes(s.start) < 17 * 60
    );
    const evening = slots.filter((s) => timeToMinutes(s.start) >= 17 * 60);
    return { morning, afternoon, evening };
  }, [availability]);

  const monthDays = useMemo(
    () => getMonthDays(monthOffset, dateLocaleTag),
    [monthOffset, dateLocaleTag]
  );
  const visibleMonthDays = useMemo(
    () => monthDays.filter((day) => availableDatesInMonth.has(day.value)),
    [monthDays, availableDatesInMonth]
  );
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const tomorrowIso = useMemo(() => toIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), []);
  const showTodayChip = availableDatesInMonth.has(todayIso);
  const showTomorrowChip = availableDatesInMonth.has(tomorrowIso);
  const monthLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    const txt = d.toLocaleDateString(dateLocaleTag, { month: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }, [monthOffset, dateLocaleTag]);
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return getMonthKeyFromDate(d);
  }, [monthOffset]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || !data.date) {
      setAvailability(null);
      setAvailabilityError(null);
      return;
    }
    let cancelled = false;
    setAvailability(null);
    setLoadingAvailability(true);
    setAvailabilityError(null);
    getBookingAvailability(apiToken, {
      employeeId: data.employeeId,
      date: data.date,
      branchId: data.branchId.trim() !== '' ? data.branchId : undefined,
      itemId: data.itemId.trim() !== '' ? data.itemId : undefined,
      noCache: true,
    })
      .then((res) => {
        if (!cancelled) setAvailability(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.employeeId, data.date, data.branchId, data.itemId]);

  useEffect(() => {
    emptyMonthAdvanceKeyRef.current = null;
  }, [data.employeeId, data.branchId, data.itemId]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || monthDays.length === 0) {
      setAvailableDatesInMonth(new Set());
      setLoadingMonthAvailability(false);
      return;
    }
    let cancelled = false;
    setAvailableDatesInMonth(new Set());
    setLoadingMonthAvailability(true);
    fetchAvailableDatesInMonth(apiToken, {
      employeeId: data.employeeId,
      branchId: data.branchId,
      itemId: data.itemId,
      monthOffset,
      monthDays,
    })
      .then((available) => {
        if (cancelled) return;
        if (available.length === 0 && monthOffset < 6) {
          const advanceKey = `${data.employeeId}|${data.branchId}|${data.itemId}|${monthOffset}`;
          if (emptyMonthAdvanceKeyRef.current !== advanceKey) {
            emptyMonthAdvanceKeyRef.current = advanceKey;
            setMonthOffset(monthOffset + 1);
            return;
          }
        }
        const next = new Set(available);
        setAvailableDatesInMonth(next);
        const remembered = lastSelectedDateByMonth[currentMonthKey];
        const selectedForMonth = data.date && next.has(data.date) ? data.date : null;
        const rememberedForMonth = remembered && next.has(remembered) ? remembered : null;
        const fallbackFirst = available.length > 0 ? available[0] : null;
        const nextDate = selectedForMonth ?? rememberedForMonth ?? fallbackFirst;

        if (nextDate) {
          setLastSelectedDateByMonth((prev) => {
            if (prev[currentMonthKey] === nextDate) return prev;
            return {
              ...prev,
              [currentMonthKey]: nextDate,
            };
          });
          setData((prev) => {
            if (
              prev.date === nextDate &&
              prev.slotStart === '' &&
              prev.slotEnd === '' &&
              prev.duration === 0
            ) {
              return prev;
            }
            return {
              ...prev,
              date: nextDate,
              slotStart: '',
              slotEnd: '',
              duration: 0,
            };
          });
        } else {
          setData((prev) => {
            if (
              prev.date === '' &&
              prev.slotStart === '' &&
              prev.slotEnd === '' &&
              prev.duration === 0
            ) {
              return prev;
            }
            return { ...prev, date: '', slotStart: '', slotEnd: '', duration: 0 };
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMonthAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.employeeId, data.branchId, data.itemId, monthOffset, currentMonthKey]);

  const selectDate = useCallback(
    (dateValue: string) => {
      const d = new Date(dateValue);
      if (!Number.isNaN(d.getTime())) {
        setLastSelectedDateByMonth((prev) => ({
          ...prev,
          [getMonthKeyFromDate(d)]: dateValue,
        }));
      }
      setData((prev) => ({
        ...prev,
        date: dateValue,
        slotStart: '',
        slotEnd: '',
        duration: 0,
      }));
    },
    [setData, setLastSelectedDateByMonth]
  );

  const selectAvailabilitySlot = useCallback(
    (slot: AvailabilitySlot) => {
      setData((prev) => ({
        ...prev,
        slotStart: slot.start,
        slotEnd: slot.end,
        duration: slot.duration,
      }));
    },
    [setData]
  );

  return {
    availability,
    loadingAvailability,
    availabilityError,
    availableDatesInMonth,
    loadingMonthAvailability,
    monthLabel,
    showTodayChip,
    showTomorrowChip,
    todayIso,
    tomorrowIso,
    visibleMonthDays,
    groupedSlots,
    selectDate,
    selectAvailabilitySlot,
  };
}
