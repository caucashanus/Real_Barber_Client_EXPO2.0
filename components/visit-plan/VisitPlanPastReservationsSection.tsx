import React, { useMemo } from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import VisitPlanReservationRow from '@/components/visit-plan/VisitPlanReservationRow';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { useTranslation } from '@/hooks/useTranslation';
import { pickVisitPlanPastBookingsPreview } from '@/utils/visitPlanBookingsHelpers';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';
import {
  VISIT_PLAN_CALENDAR_PAST_BOOKINGS_LIMIT,
  VISIT_PLAN_MAIN_PAST_BOOKINGS_LIMIT,
} from '@/utils/visitPlanPastBookingTypes';

type Props = {
  onPastBookingPress: (booking: VisitPlanPastBooking) => void;
  mode?: 'main' | 'calendar';
};

export default function VisitPlanPastReservationsSection({
  onPastBookingPress,
  mode = 'main',
}: Props) {
  const { t } = useTranslation();
  const { homeBookings } = useVisitPlan();

  const preview = useMemo(
    () =>
      pickVisitPlanPastBookingsPreview(
        homeBookings,
        mode === 'calendar'
          ? VISIT_PLAN_CALENDAR_PAST_BOOKINGS_LIMIT
          : VISIT_PLAN_MAIN_PAST_BOOKINGS_LIMIT
      ),
    [homeBookings, mode]
  );

  return (
    <View className="w-full gap-3">
      <ThemedText className="text-base font-bold">{t('visitPlanPastReservationsHeading')}</ThemedText>
      {preview.length === 0 ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('visitPlanPastReservationsEmpty')}
        </ThemedText>
      ) : (
        <View>
          {preview.map((booking, index) => (
            <VisitPlanReservationRow
              key={booking.id}
              booking={booking}
              showDivider={index > 0}
              onPress={() => onPastBookingPress(booking)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
