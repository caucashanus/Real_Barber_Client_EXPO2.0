import type { Booking } from '@/api/bookings';
import { KIDS_HAIRCUT_CRM_ITEM_ID } from '@/constants/kidsHaircutBooking';

export function getKidsHaircutCrmItemId(): string {
  return KIDS_HAIRCUT_CRM_ITEM_ID;
}

/** Parita web `isKidsHaircutBooking()`. */
export function isKidsHaircutBooking(booking: Booking): boolean {
  const itemId = String(booking.itemId ?? booking.item?.id ?? '')
    .trim()
    .toLowerCase();
  return itemId === KIDS_HAIRCUT_CRM_ITEM_ID.toLowerCase();
}
