import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import ThemedScroller from '@/components/ThemeScroller';
import VisitPlanBookedVisitBanner from '@/components/visit-plan/VisitPlanBookedVisitBanner';
import { useVisitPlanCalendarDayBooking } from '@/components/visit-plan/VisitPlanCalendarDayBooking';
import VisitPlanCalendarSection from '@/components/visit-plan/VisitPlanCalendarSection';
import VisitPlanFirstVisitEmptyCard from '@/components/visit-plan/VisitPlanFirstVisitEmptyCard';
import VisitPlanIntervalCard from '@/components/visit-plan/VisitPlanIntervalCard';
import VisitPlanNextVisitBanner from '@/components/visit-plan/VisitPlanNextVisitBanner';
import VisitPlanPageBanner from '@/components/visit-plan/VisitPlanPageBanner';
import VisitPlanPastReservationActionSheet from '@/components/visit-plan/VisitPlanPastReservationActionSheet';
import VisitPlanPastReservationsSection from '@/components/visit-plan/VisitPlanPastReservationsSection';
import VisitPlanScheduledReservationsSection from '@/components/visit-plan/VisitPlanScheduledReservationsSection';
import VisitPlanUpcomingBookingNotice from '@/components/visit-plan/VisitPlanUpcomingBookingNotice';
import VisitPlanSettingsSheet from '@/components/visit-plan/VisitPlanSettingsSheet';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { addDays } from '@/utils/visitPlanDates';
import { pickVisitPlanUpcomingBookings } from '@/utils/visitPlanBookingsHelpers';
import { pickRecentHomeBookings } from '@/utils/pickRecentHomeBookings';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

function SectionBlock({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-4 w-full self-stretch" style={{ alignSelf: 'stretch', width: '100%' }}>
      {children}
    </View>
  );
}

export default function VisitPlanMainContent() {
  const {
    todayIso,
    prefs,
    savePrefs,
    saving,
    nextVisitTarget,
    idealVisitCenterIso,
    calendarIdealCenterIso,
    upcomingBookingDate,
    homeBookings,
    firstVisitMode,
  } = useVisitPlan();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialField, setSettingsInitialField] = useState<
    'interval' | null
  >(null);

  const openSettings = (field: 'interval' | null = null) => {
    setSettingsInitialField(field);
    setSettingsOpen(true);
  };
  const pastSheetRef = useRef<ActionSheetRef>(null);
  const [pastSheetBooking, setPastSheetBooking] = useState<VisitPlanPastBooking | null>(null);

  const pastTemplateBooking = useMemo(
    () => pickRecentHomeBookings(homeBookings, 1)[0] ?? null,
    [homeBookings]
  );

  const openPastSheet = (booking: VisitPlanPastBooking) => {
    setPastSheetBooking(booking);
  };

  useEffect(() => {
    if (!pastSheetBooking) return;
    pastSheetRef.current?.show();
  }, [pastSheetBooking?.id]);

  const closePastSheet = () => {
    pastSheetRef.current?.hide();
    setPastSheetBooking(null);
  };

  const bannerVisitTarget = useMemo(
    () => nextVisitTarget ?? addDays(todayIso, prefs.intervalDays),
    [nextVisitTarget, todayIso, prefs.intervalDays]
  );
  const hasUpcomingBooking = Boolean(upcomingBookingDate);
  const nearestUpcoming = useMemo(
    () => pickVisitPlanUpcomingBookings(homeBookings)[0] ?? null,
    [homeBookings]
  );

  const intervalCard = (
    <VisitPlanIntervalCard
      intervalDays={prefs.intervalDays}
      onEdit={() => openSettings('interval')}
    />
  );
  const { openDay: openCalendarDay, sheet: calendarDayBookingSheet } =
    useVisitPlanCalendarDayBooking(todayIso);

  return (
    <>
      <ThemedScroller
        className="flex-1"
        footerSpacer={false}
        contentContainerStyle={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '100%',
          paddingBottom: 48,
          alignItems: 'stretch',
        }}>
        {hasUpcomingBooking && nearestUpcoming ? (
          <SectionBlock>
            <VisitPlanBookedVisitBanner todayIso={todayIso} booking={nearestUpcoming} />
          </SectionBlock>
        ) : null}

        {!hasUpcomingBooking && firstVisitMode ? (
          <SectionBlock>
            <VisitPlanPageBanner variant="firstVisit" />
          </SectionBlock>
        ) : null}

        {!hasUpcomingBooking && !firstVisitMode ? (
          <SectionBlock>
            <VisitPlanPageBanner todayIso={todayIso} nextVisitTarget={bannerVisitTarget} />
          </SectionBlock>
        ) : null}

        {!hasUpcomingBooking ? <SectionBlock>{intervalCard}</SectionBlock> : null}

        <SectionBlock>
          <VisitPlanCalendarSection
            todayIso={todayIso}
            idealVisitCenterIso={idealVisitCenterIso}
            calendarIdealCenterIso={calendarIdealCenterIso}
            intervalDays={prefs.intervalDays}
            upcomingBookingDate={upcomingBookingDate}
            firstVisitMode={firstVisitMode}
            onDayPress={openCalendarDay}
          />
        </SectionBlock>

        {hasUpcomingBooking && !firstVisitMode ? (
          <SectionBlock>
            <VisitPlanUpcomingBookingNotice />
          </SectionBlock>
        ) : null}

        {firstVisitMode ? (
          <SectionBlock>
            <VisitPlanFirstVisitEmptyCard />
          </SectionBlock>
        ) : (
          <>
            <SectionBlock>
              <VisitPlanScheduledReservationsSection />
            </SectionBlock>

            <SectionBlock>
              <VisitPlanPastReservationsSection onPastBookingPress={openPastSheet} />
            </SectionBlock>
          </>
        )}

        {hasUpcomingBooking ? <SectionBlock>{intervalCard}</SectionBlock> : null}

        {!upcomingBookingDate && !firstVisitMode ? (
          <SectionBlock>
            <VisitPlanNextVisitBanner
              nextVisitTarget={bannerVisitTarget}
              onPress={() => openSettings(null)}
            />
          </SectionBlock>
        ) : null}
      </ThemedScroller>

      <VisitPlanSettingsSheet
        open={settingsOpen}
        onOpenChange={(next) => {
          setSettingsOpen(next);
          if (!next) setSettingsInitialField(null);
        }}
        initialField={settingsInitialField}
        onNestedFieldClosed={() => setSettingsInitialField(null)}
        prefs={prefs}
        onSavePrefs={savePrefs}
        saving={saving}
      />

      {calendarDayBookingSheet}

      <VisitPlanPastReservationActionSheet
        booking={pastSheetBooking}
        templateBooking={pastTemplateBooking}
        sheetRef={pastSheetRef}
        onClose={closePastSheet}
      />
    </>
  );
}
