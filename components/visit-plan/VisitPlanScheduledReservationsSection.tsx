import React, { useMemo } from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import VisitPlanReservationRow from '@/components/visit-plan/VisitPlanReservationRow';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { useTranslation } from '@/hooks/useTranslation';
import { pickVisitPlanUpcomingBookings } from '@/utils/visitPlanBookingsHelpers';

export default function VisitPlanScheduledReservationsSection() {
  const { t } = useTranslation();
  const { homeBookings } = useVisitPlan();
  const upcoming = useMemo(
    () => pickVisitPlanUpcomingBookings(homeBookings),
    [homeBookings]
  );

  if (upcoming.length === 0) return null;

  return (
    <View className="w-full gap-3">
      <ThemedText className="text-base font-bold">{t('visitPlanScheduledReservationsHeading')}</ThemedText>
      <View className="w-full">
        {upcoming.map((booking, index) => (
          <VisitPlanReservationRow
            key={booking.id}
            booking={booking}
            showDivider={index > 0}
          />
        ))}
      </View>
    </View>
  );
}
