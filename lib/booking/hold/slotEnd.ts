import type { BookingSlot } from '@/lib/booking/constants';

/** CRM requires slotEnd; derive from service duration or +60 min fallback. */
export function resolveHoldSlotEnd(
  slot: Pick<BookingSlot, 'start' | 'end'>,
  serviceDurationMinutes?: number | null
): string {
  const trimmedEnd = slot.end?.trim();
  if (trimmedEnd) return trimmedEnd;

  const match = /^(\d{1,2}):(\d{2})/.exec(slot.start.trim());
  if (!match) return slot.start.trim();

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const duration =
    typeof serviceDurationMinutes === 'number' && serviceDurationMinutes > 0
      ? serviceDurationMinutes
      : 60;
  const totalMinutes = startHour * 60 + startMinute + duration;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
}
