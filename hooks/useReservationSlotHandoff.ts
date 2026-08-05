import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getBookingSlotServices,
  type BookingSlotServiceItem,
} from '@/api/bookings';
import type { CrmClient } from '@/api/auth';
import type { ReservationFlowDataState } from '@/hooks/reservationCreateFlowShared';
import { isClientContactComplete } from '@/utils/clientContactHelpers';
import {
  clearReservationSlotHandoff,
  readReservationSlotHandoff,
  type ReservationSlotHandoff,
} from '@/utils/reservationSlotHandoff';
import type { BarberEntryMode } from '@/utils/reservationCreateHelpers';
import { formatBookingSlotHandoffContextLine } from '@/utils/reservationCreateHelpers';
import type { TranslationKey } from '@/locales';

interface UseReservationSlotHandoffParams extends ReservationFlowDataState {
  apiToken: string | null;
  client: CrmClient | null | undefined;
  barberEntryMode: BarberEntryMode;
  presetEmployeeId: string | undefined;
  dateLocaleTag: string;
  t: (key: TranslationKey) => string;
}

function isServiceAvailableInHandoffSlot(service: BookingSlotServiceItem): boolean {
  if (service.availableInSlot === true || service.inSlot === true) return true;
  if (service.availableInSlot === false || service.inSlot === false) return false;
  return !service.nextAvailable;
}

export function useReservationSlotHandoff({
  apiToken,
  client,
  barberEntryMode,
  presetEmployeeId,
  dateLocaleTag,
  t,
  data,
  setData,
}: UseReservationSlotHandoffParams) {
  const [handoff, setHandoff] = useState<ReservationSlotHandoff | null>(null);
  const [slotServices, setSlotServices] = useState<BookingSlotServiceItem[]>([]);
  const [loadingSlotServices, setLoadingSlotServices] = useState(false);
  const [slotServicesError, setSlotServicesError] = useState<string | null>(null);

  const isSlotHandoffFlow = barberEntryMode === 'slotHandoff' && Boolean(handoff);

  useEffect(() => {
    if (barberEntryMode !== 'slotHandoff' || !presetEmployeeId) {
      setHandoff(null);
      return;
    }
    readReservationSlotHandoff()
      .then((stored) => {
        if (stored?.employeeId === presetEmployeeId) {
          setHandoff(stored);
        } else {
          setHandoff(null);
        }
      })
      .catch(() => setHandoff(null));
  }, [barberEntryMode, presetEmployeeId]);

  useEffect(() => {
    if (!isSlotHandoffFlow || !apiToken || !handoff) {
      setSlotServices([]);
      setSlotServicesError(null);
      return;
    }
    let cancelled = false;
    setLoadingSlotServices(true);
    setSlotServicesError(null);
    getBookingSlotServices(apiToken, {
      employeeId: handoff.employeeId,
      branchId: handoff.branchId,
      date: handoff.date,
      slotStart: handoff.slotStart,
      slotEnd: handoff.slotEnd,
    })
      .then((services) => {
        if (!cancelled) setSlotServices(services);
      })
      .catch((e) => {
        if (!cancelled) {
          setSlotServices([]);
          setSlotServicesError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlotServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSlotHandoffFlow, apiToken, handoff]);

  const skipDatetime = useMemo(
    () => Boolean(isSlotHandoffFlow && apiToken && isClientContactComplete(client)),
    [isSlotHandoffFlow, apiToken, client]
  );

  const selectSlotService = useCallback(
    (service: BookingSlotServiceItem) => {
      if (!handoff) return;
      const inSlot = isServiceAvailableInHandoffSlot(service);
      const next = service.nextAvailable;
      const date = inSlot ? handoff.date : (next?.date ?? handoff.date);
      const slotStart = inSlot ? handoff.slotStart : (next?.slotStart ?? handoff.slotStart);
      const slotEnd = inSlot ? (handoff.slotEnd ?? service.slotEnd ?? '') : (next?.slotEnd ?? '');

      setData((prev) => ({
        ...prev,
        branchId: handoff.branchId,
        employeeId: handoff.employeeId,
        itemId: service.id,
        date,
        slotStart,
        slotEnd,
        duration: service.duration ?? prev.duration ?? 0,
      }));

      if (!skipDatetime) {
        clearReservationSlotHandoff().catch(() => {});
      }
    },
    [handoff, setData, skipDatetime]
  );

  const consumeHandoffAfterBooking = useCallback(async () => {
    await clearReservationSlotHandoff();
    setHandoff(null);
  }, []);

  const slotHandoffContextLabel = useMemo(() => {
    if (!handoff) return '';
    return formatBookingSlotHandoffContextLine({
      employeeName: handoff.employeeName,
      branchName: handoff.branchName,
      branchAddress: handoff.branchAddress,
      date: handoff.date,
      slotStart: handoff.slotStart,
      dateLocaleTag,
      t,
    });
  }, [handoff, dateLocaleTag, t]);

  return {
    handoff,
    isSlotHandoffFlow,
    slotServices,
    loadingSlotServices,
    slotServicesError,
    skipDatetime,
    selectSlotService,
    consumeHandoffAfterBooking,
    slotHandoffContextLabel,
    isServiceAvailableInHandoffSlot,
    selectedSlotServiceId: data.itemId,
  };
}
