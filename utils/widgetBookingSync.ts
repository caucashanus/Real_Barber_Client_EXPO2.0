import { Platform } from 'react-native';

import type { Booking } from '@/api/bookings';
import bookingWidget from '@/widgets/RealBarberBookingWidget';
import {
  buildWidgetBookingTimeline,
  EMPTY_WIDGET_BOOKING_PROPS,
  pickNextWidgetBooking,
} from '@/utils/widgetBookingData';

/** Po načtení rezervací v appce uloží nejbližší termín do iOS widgetu. */
export async function syncBookingWidgetFromBookings(bookings: Booking[]): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const next = pickNextWidgetBooking(bookings);

    if (!next) {
      bookingWidget.updateSnapshot(EMPTY_WIDGET_BOOKING_PROPS);
    } else {
      bookingWidget.updateTimeline(buildWidgetBookingTimeline(next));
    }
    bookingWidget.reload();
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] sync failed', error);
    }
  }
}
