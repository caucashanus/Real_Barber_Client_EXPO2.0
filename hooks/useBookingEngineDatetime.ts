import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getBookingCalendar,
  getBookingCalendarMultiBranch,
} from '@/api/bookingEngine';
import {
  ANY_EMPLOYEE_ID,
  type BookingEntity,
  type BookingService,
  type BookingSlot,
} from '@/lib/booking/constants';
import type { BookingFlatAvailabilityMap } from '@/lib/booking/booking-api/types';
import {
  getDatesWithSlots,
  getMultiBranchDatesWithSlots,
  getMultiBranchSlotsForDate,
  getSlotsForDate,
} from '@/lib/booking/booking-api/mappers';
import { todayIsoInPrague, addDaysIso } from '@/lib/booking/calendarDate';
import { CALENDAR_INITIAL_DAYS } from '@/lib/booking/progressiveAvailability';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import { resolveBranchName } from '@/lib/booking/designShared';
import { trackBookingMonitor } from '@/lib/booking/monitor/client';
import type { TranslationKey } from '@/locales';
import {
  calendarTargetFromNearestSlot,
  findBookingSlotMatchingStart,
  findNearestAvailableBookingDate,
  formatBookingCalendarLongDate,
  toIsoDate,
} from '@/utils/reservationCreateHelpers';

type MonitorFields = (stepKind: BookingStepKind) => Record<string, unknown>;

export function useBookingEngineDatetime(params: {
  step: BookingStepKind;
  selectedService: BookingService | null;
  selectedEmployee: BookingEntity | null;
  profileEmployee: BookingEntity | null;
  selectedBranch: BookingEntity | null;
  profileBranches: { id: string; name?: string; address?: string }[];
  branches: BookingEntity[];
  multiBranchLegend: boolean;
  selectedDate: string | null;
  selectedSlot: BookingSlot | null;
  setDate: (date: string | null, options?: { clearSlot?: boolean }) => void;
  setSlot: (slot: BookingSlot | null) => void;
  holdId: string | null | undefined;
  locale: string;
  apiToken: string | null;
  t: (key: TranslationKey) => string;
  setError: (message: string | null) => void;
  dateLocaleTag: string;
  monitorFields: MonitorFields;
  employeeNearestChipEmployeeId: string | null;
  setEmployeeNearestChipEmployeeId: (id: string | null) => void;
}) {
  const {
    step,
    selectedService,
    selectedEmployee,
    profileEmployee,
    selectedBranch,
    profileBranches,
    branches,
    multiBranchLegend,
    selectedDate,
    selectedSlot,
    setDate,
    setSlot,
    holdId,
    locale,
    apiToken,
    t,
    setError,
    dateLocaleTag,
    monitorFields,
    employeeNearestChipEmployeeId,
    setEmployeeNearestChipEmployeeId,
  } = params;

  const [availabilityData, setAvailabilityData] = useState<{
    availability?: BookingFlatAvailabilityMap;
  } | null>(null);
  const [availabilityByBranch, setAvailabilityByBranch] = useState<
    Record<string, { availability?: BookingFlatAvailabilityMap } | null>
  >({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const todayIso = useMemo(() => todayIsoInPrague(), []);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  useEffect(() => {
    if (step !== 'datetime') return;
    if (!selectedService?.id) return;

    const employee = profileEmployee ?? selectedEmployee;
    const employeeId = employee?.id === ANY_EMPLOYEE_ID ? 'any' : employee?.id;
    if (!employeeId) return;

    let cancelled = false;
    setLoadingCalendar(true);
    const from = todayIso;

    if (multiBranchLegend && profileBranches.length >= 2) {
      getBookingCalendarMultiBranch(
        {
          employeeId,
          itemId: selectedService.id,
          from,
          days: CALENDAR_INITIAL_DAYS,
          branchIds: profileBranches.map((b) => b.id),
          locale,
          holdId,
        },
        apiToken
      )
        .then((data) => {
          if (cancelled) return;
          const next: Record<string, { availability?: BookingFlatAvailabilityMap } | null> = {};
          for (const branch of data.branches ?? []) {
            next[branch.id] = { availability: branch.availability };
          }
          setAvailabilityByBranch(next);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
        })
        .finally(() => {
          if (!cancelled) setLoadingCalendar(false);
        });
    } else {
      const branchId = selectedBranch?.id ?? profileBranches[0]?.id;
      if (!branchId) {
        setLoadingCalendar(false);
        return;
      }
      getBookingCalendar(
        {
          branchId,
          itemId: selectedService.id,
          employeeId,
          from,
          days: CALENDAR_INITIAL_DAYS,
          locale,
          holdId,
        },
        apiToken
      )
        .then((data) => {
          if (!cancelled) setAvailabilityData({ availability: data.availability });
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
        })
        .finally(() => {
          if (!cancelled) setLoadingCalendar(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedService?.id,
    selectedEmployee?.id,
    profileEmployee?.id,
    selectedBranch?.id,
    profileBranches,
    multiBranchLegend,
    todayIso,
    locale,
    apiToken,
    t,
    holdId,
    calendarRefreshKey,
    setError,
  ]);

  const datesWithSlots = useMemo(() => {
    if (multiBranchLegend) return getMultiBranchDatesWithSlots(availabilityByBranch);
    return getDatesWithSlots(availabilityData?.availability);
  }, [multiBranchLegend, availabilityByBranch, availabilityData]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    if (multiBranchLegend) return getMultiBranchSlotsForDate(availabilityByBranch, selectedDate);
    return getSlotsForDate(availabilityData?.availability, selectedDate);
  }, [selectedDate, multiBranchLegend, availabilityByBranch, availabilityData]);

  const monthAnchor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = useMemo(
    () =>
      monthAnchor.toLocaleDateString(dateLocaleTag, {
        month: 'long',
        year: 'numeric',
      }),
    [monthAnchor, dateLocaleTag]
  );

  const visibleMonthDays = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { value: string; label: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const value = toIsoDate(date);
      if (value < todayIso) continue;
      if (!datesWithSlots.includes(value)) continue;
      out.push({
        value,
        label: date.toLocaleDateString(dateLocaleTag, { weekday: 'short', day: 'numeric' }),
      });
    }
    return out;
  }, [monthAnchor, dateLocaleTag, todayIso, datesWithSlots]);

  const monthCalendarDays = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ value: string; label: string; available: boolean; isToday: boolean }> = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const value = toIsoDate(date);
      if (value < todayIso) continue;
      out.push({
        value,
        label: date.toLocaleDateString(dateLocaleTag, { weekday: 'short', day: 'numeric' }),
        available: datesWithSlots.includes(value),
        isToday: value === todayIso,
      });
    }
    return out;
  }, [monthAnchor, dateLocaleTag, todayIso, datesWithSlots]);

  const nearestAvailableDate = useMemo(
    () => findNearestAvailableBookingDate(datesWithSlots, selectedDate),
    [datesWithSlots, selectedDate]
  );

  const nearestAvailableDateLabel = useMemo(() => {
    if (!nearestAvailableDate) return null;
    return formatBookingCalendarLongDate(nearestAvailableDate, dateLocaleTag);
  }, [nearestAvailableDate, dateLocaleTag]);

  const selectedDateHasNoSlots = Boolean(
    selectedDate && !loadingCalendar && slotsForSelectedDate.length === 0
  );

  const jumpToNearestAvailableDate = useCallback(() => {
    if (!nearestAvailableDate) return;
    const target = calendarTargetFromNearestSlot(nearestAvailableDate);
    if (target) setMonthOffset(target.monthOffset);
    setDate(nearestAvailableDate);
    setSlot(null);
    trackBookingMonitor('selected_date', {
      ...monitorFields('datetime'),
      date: nearestAvailableDate,
    });
  }, [nearestAvailableDate, setDate, setSlot, monitorFields]);

  useEffect(() => {
    if (step !== 'datetime' || loadingCalendar) return;
    if (selectedDate) return;
    setDate(todayIso);
  }, [step, loadingCalendar, selectedDate, todayIso, setDate]);

  useEffect(() => {
    if (step !== 'datetime' || loadingCalendar) return;
    if (!employeeNearestChipEmployeeId || !selectedDate || !selectedSlot?.start) return;

    const slots = slotsForSelectedDate;
    if (slots.length === 0) return;

    const matched = findBookingSlotMatchingStart(slots, selectedSlot.start);
    if (!matched) {
      setSlot(null);
      setEmployeeNearestChipEmployeeId(null);
      return;
    }

    const branchName = matched.branchId
      ? resolveBranchName(matched.branchId, branches, profileBranches)
      : undefined;

    const needsUpdate =
      selectedSlot.start !== matched.start ||
      selectedSlot.end !== matched.end ||
      (matched.branchId ?? '') !== (selectedSlot.branchId ?? '') ||
      (matched.employeeId ?? '') !== (selectedSlot.employeeId ?? '');

    if (!needsUpdate) return;

    setSlot({
      start: matched.start,
      end: matched.end,
      branchId: matched.branchId,
      employeeId: matched.employeeId,
      branchName,
    });
  }, [
    step,
    loadingCalendar,
    employeeNearestChipEmployeeId,
    selectedDate,
    selectedSlot,
    slotsForSelectedDate,
    branches,
    profileBranches,
    setSlot,
    setEmployeeNearestChipEmployeeId,
  ]);

  const refreshCalendar = useCallback(() => {
    setCalendarRefreshKey((value) => value + 1);
  }, []);

  return {
    availabilityByBranch,
    loadingCalendar,
    monthOffset,
    setMonthOffset,
    todayIso,
    tomorrowIso,
    monthLabel,
    visibleMonthDays,
    monthCalendarDays,
    datesWithSlots,
    slotsForSelectedDate,
    selectedDateHasNoSlots,
    nearestAvailableDate,
    nearestAvailableDateLabel,
    jumpToNearestAvailableDate,
    refreshCalendar,
  };
}
