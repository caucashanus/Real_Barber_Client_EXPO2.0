import React, { useCallback, useMemo, useState } from 'react';

import VisitPlanDayBookingSheet from '@/components/visit-plan/VisitPlanDayBookingSheet';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { findHomeBookingById, pickVisitPlanPastBookingsPreview } from '@/utils/visitPlanBookingsHelpers';

type Props = {
  todayIso: string;
  children: (openDay: (dateIso: string) => void) => React.ReactNode;
};

/** Sheet + handler pro klik na den v kalendáři plánu návštěv (parita web). */
export function useVisitPlanCalendarDayBooking(todayIso: string) {
  const { homeBookings } = useVisitPlan();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const pastPreview = pickVisitPlanPastBookingsPreview(homeBookings, 1)[0];
  const templateBooking = pastPreview
    ? findHomeBookingById(homeBookings, pastPreview.id)
    : undefined;

  const openDay = useCallback(
    (dateIso: string) => {
      if (dateIso < todayIso) return;
      setSelectedDateIso(dateIso);
      setSheetOpen(true);
    },
    [todayIso]
  );

  const sheet = useMemo(
    () => (
      <VisitPlanDayBookingSheet
        dateIso={selectedDateIso}
        templateBooking={templateBooking ?? null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    ),
    [selectedDateIso, templateBooking, sheetOpen]
  );

  return { openDay, sheet };
}

export default function VisitPlanCalendarDayBooking({ todayIso, children }: Props) {
  const { openDay, sheet } = useVisitPlanCalendarDayBooking(todayIso);

  return (
    <>
      {children(openDay)}
      {sheet}
    </>
  );
}
