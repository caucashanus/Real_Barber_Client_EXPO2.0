import { Platform } from 'react-native';

import type { Booking } from '@/api/bookings';
import bookingWidget from '@/widgets/RealBarberBookingWidget';
import {
  buildWidgetBookingTimeline,
  EMPTY_WIDGET_BOOKING_PROPS,
  pickNextWidgetBooking,
  type RealBarberBookingWidgetProps,
} from '@/utils/widgetBookingData';
import { ensureWidgetLogoUri } from '@/utils/widgetSharedAssets';

function withWidgetLogo(
  props: RealBarberBookingWidgetProps,
  logoUri: string | null
): RealBarberBookingWidgetProps {
  return logoUri ? { ...props, logoUri } : props;
}

/** Po načtení rezervací v appce uloží nejbližší termín do iOS widgetu. */
export async function syncBookingWidgetFromBookings(bookings: Booking[]): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const logoUri = await ensureWidgetLogoUri();
    const next = pickNextWidgetBooking(bookings);

    if (!next) {
      bookingWidget.updateSnapshot(withWidgetLogo(EMPTY_WIDGET_BOOKING_PROPS, logoUri));
    } else {
      bookingWidget.updateTimeline(
        buildWidgetBookingTimeline(next).map((entry) => ({
          ...entry,
          props: withWidgetLogo(entry.props, logoUri),
        }))
      );
    }
    bookingWidget.reload();
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] sync failed', error);
    }
  }
}
