import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import type { CrmClient } from '@/api/auth';
import type { BookingReservationContact } from '@/lib/booking/authContact';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import type { BookingRecipeId } from '@/lib/booking/engine/types';
import { bookingMonitorFieldsFromSelections } from '@/lib/booking/monitor/buildFields';
import {
  ensureBookingMonitorSession,
  promoteBookingMonitorEntryNearestSlot,
  setBookingMonitorIdentity,
  trackBookingMonitor,
  trackBookingMonitorLeftPage,
  trackBookingMonitorSessionStarted,
} from '@/lib/booking/monitor/client';

type MonitorFields = ReturnType<typeof bookingMonitorFieldsFromSelections>;

export function useBookingEngineMonitor(params: {
  client: CrmClient | null | undefined;
  contactContext: BookingReservationContact;
  recipeId: BookingRecipeId;
  fromSlotHandoff: boolean;
  routeMonitorFrom: string | undefined;
  preset: {
    branchId?: string;
    employeeId?: string;
    serviceId?: string;
  };
  profileLoading: boolean;
  profileEmployee: { id: string } | null;
  step: BookingStepKind;
  monitorFields: (stepKind: BookingStepKind) => MonitorFields;
  submitSuccess: boolean;
  abandonBookingFlow: () => void;
}) {
  const {
    client,
    contactContext,
    recipeId,
    fromSlotHandoff,
    routeMonitorFrom,
    preset,
    profileLoading,
    profileEmployee,
    step,
    monitorFields,
    submitSuccess,
    abandonBookingFlow,
  } = params;

  const monitorSessionInitRef = useRef(false);

  useEffect(() => {
    setBookingMonitorIdentity({
      client,
      phone: contactContext.phone,
      clientName: contactContext.firstName
        ? `${contactContext.firstName} ${contactContext.lastName}`.trim()
        : null,
    });
  }, [client, contactContext]);

  useEffect(() => {
    if (monitorSessionInitRef.current) return;
    monitorSessionInitRef.current = true;
    ensureBookingMonitorSession({
      recipeId,
      nearestSlotHandoff: fromSlotHandoff,
      from: routeMonitorFrom,
      branchId: preset.branchId,
      employeeId: preset.employeeId,
      serviceId: preset.serviceId,
    });
  }, [
    recipeId,
    fromSlotHandoff,
    routeMonitorFrom,
    preset.branchId,
    preset.employeeId,
    preset.serviceId,
  ]);

  useEffect(() => {
    if (fromSlotHandoff) promoteBookingMonitorEntryNearestSlot();
  }, [fromSlotHandoff]);

  useEffect(() => {
    if (recipeId === 'employee-profile' && profileLoading && !profileEmployee) return;
    trackBookingMonitorSessionStarted(monitorFields(step));
  }, [recipeId, profileLoading, profileEmployee, step, monitorFields]);

  const summaryEnteredRef = useRef(false);
  useEffect(() => {
    if (step !== 'summary') {
      summaryEnteredRef.current = false;
      return;
    }
    if (summaryEnteredRef.current) return;
    summaryEnteredRef.current = true;
    trackBookingMonitor('entered_summary', monitorFields('summary'));
  }, [step, monitorFields]);

  const leaveMonitorRef = useRef({ submitSuccess: false, fields: monitorFields(step) });
  leaveMonitorRef.current = {
    submitSuccess,
    fields: monitorFields(step),
  };

  useEffect(() => {
    return () => {
      if (leaveMonitorRef.current.submitSuccess) return;
      trackBookingMonitorLeftPage(leaveMonitorRef.current.fields);
    };
  }, []);

  const flowAbandonRef = useRef({
    submitSuccess: false,
    abandon: () => {},
  });
  flowAbandonRef.current = {
    submitSuccess,
    abandon: abandonBookingFlow,
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (flowAbandonRef.current.submitSuccess) return;
        flowAbandonRef.current.abandon();
      };
    }, [])
  );

  const holdLeaveRef = useRef({
    submitSuccess: false,
    abandon: () => {},
  });
  holdLeaveRef.current = {
    submitSuccess,
    abandon: abandonBookingFlow,
  };

  useEffect(() => {
    return () => {
      if (holdLeaveRef.current.submitSuccess) return;
      holdLeaveRef.current.abandon();
    };
  }, []);
}
