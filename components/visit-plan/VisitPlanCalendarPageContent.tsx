import React, { useMemo } from 'react';
import { View } from 'react-native';

import SurfaceCard from '@/components/layout/SurfaceCard';
import VisitPlanCalendarDayBooking from '@/components/visit-plan/VisitPlanCalendarDayBooking';
import VisitPlanCalendarHighlightLegend from '@/components/visit-plan/VisitPlanCalendarHighlightLegend';
import VisitPlanCalendarTermsList from '@/components/visit-plan/VisitPlanCalendarTermsList';
import VisitPlanMonthCalendar from '@/components/visit-plan/VisitPlanMonthCalendar';
import VisitPlanFirstVisitEmptyCard from '@/components/visit-plan/VisitPlanFirstVisitEmptyCard';
import VisitPlanPastReservationsSection from '@/components/visit-plan/VisitPlanPastReservationsSection';
import VisitPlanScheduledReservationsSection from '@/components/visit-plan/VisitPlanScheduledReservationsSection';
import VisitPlanUpcomingBookingNotice from '@/components/visit-plan/VisitPlanUpcomingBookingNotice';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { buildVisitPlanDayHighlights } from '@/utils/visitPlanCalendarHighlights';
import { buildVisitPlanRecommendedTerm } from '@/utils/visitPlanCalendarTerms';
import { normalizeIsoDateString } from '@/utils/visitPlanDates';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

type Props = {
  onPastBookingPress: (booking: VisitPlanPastBooking) => void;
};

function SectionBlock({ children }: { children: React.ReactNode }) {
  return <View className="mb-4 w-full self-stretch">{children}</View>;
}

export default function VisitPlanCalendarPageContent({ onPastBookingPress }: Props) {
  const {
    todayIso,
    nextVisitTarget,
    idealVisitCenterIso,
    calendarIdealCenterIso,
    upcomingBookingDate,
    firstVisitMode,
    prefs,
  } = useVisitPlan();

  const confirmedBookingIso = normalizeIsoDateString(upcomingBookingDate);
  const calendarFocus =
    confirmedBookingIso ?? (firstVisitMode ? todayIso : calendarIdealCenterIso);

  const dayHighlights = useMemo(
    () =>
      buildVisitPlanDayHighlights({
        idealVisitCenterIso,
        confirmedBookingDate: confirmedBookingIso,
        intervalDays: prefs.intervalDays,
        suppressIdealHighlight: firstVisitMode,
      }),
    [idealVisitCenterIso, confirmedBookingIso, prefs.intervalDays, firstVisitMode]
  );

  const recommendedTerm = useMemo(
    () =>
      buildVisitPlanRecommendedTerm(nextVisitTarget, {
        upcomingBookingDate: confirmedBookingIso,
        intervalDays: prefs.intervalDays,
      }),
    [nextVisitTarget, confirmedBookingIso, prefs.intervalDays]
  );
  const recommendedTerms = recommendedTerm ? [recommendedTerm] : [];

  return (
    <VisitPlanCalendarDayBooking todayIso={todayIso}>
      {(openDay) => (
        <View className="w-full self-stretch">
          {confirmedBookingIso ? (
            <SectionBlock>
              <VisitPlanUpcomingBookingNotice />
            </SectionBlock>
          ) : null}

          <SectionBlock>
            <SurfaceCard
              rounded="2xl"
              className="w-full self-stretch">
              <View className="px-4 py-3">
                <VisitPlanMonthCalendar
                  todayIso={todayIso}
                  focusDateIso={calendarFocus}
                  idealVisitCenterIso={calendarIdealCenterIso}
                  dayHighlights={dayHighlights}
                  onDayPress={openDay}
                />
              </View>
              <View className="px-4 pb-3 pt-2">
                <VisitPlanCalendarHighlightLegend
                  hasUpcomingBooking={Boolean(confirmedBookingIso)}
                  showNextRecommendedLegend={Boolean(confirmedBookingIso) && !firstVisitMode}
                  suppressIdealLegend={firstVisitMode}
                  legendTopClassName="pt-0"
                />
              </View>
            </SurfaceCard>
          </SectionBlock>

          {recommendedTerms.length > 0 ? (
            <SectionBlock>
              <VisitPlanCalendarTermsList terms={recommendedTerms} onRecommendedPress={openDay} />
            </SectionBlock>
          ) : null}

          {firstVisitMode ? (
            <SectionBlock>
              <VisitPlanFirstVisitEmptyCard />
            </SectionBlock>
          ) : (
            <View className="w-full self-stretch">
              <SectionBlock>
                <VisitPlanScheduledReservationsSection />
              </SectionBlock>

              <SectionBlock>
                <VisitPlanPastReservationsSection
                  mode="calendar"
                  onPastBookingPress={onPastBookingPress}
                />
              </SectionBlock>
            </View>
          )}
        </View>
      )}
    </VisitPlanCalendarDayBooking>
  );
}
