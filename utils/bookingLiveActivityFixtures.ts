import type { Booking } from '@/api/bookings';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatBookingDateParts(date: Date): { date: string; slotStart: string; slotEnd: string } {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const slotStart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const end = new Date(date.getTime() + 60 * 60 * 1000);
  const slotEnd = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  return { date: `${y}-${m}-${d}`, slotStart, slotEnd };
}

/** Mock rezervace pro preview — termín = `appointmentDate`. */
export function createBookingLiveActivityPreviewBookingAt(
  appointmentDate: Date,
  overrides?: Partial<Booking>
): Booking {
  const { date, slotStart, slotEnd } = formatBookingDateParts(appointmentDate);

  return {
    id: 'preview-booking-la',
    clientId: 'preview-client',
    employeeId: 'preview-employee',
    branchId: 'd15ee0b6-2e66-4edf-a4d1-5f87a89535a3',
    itemId: 'preview-item',
    date,
    slotStart,
    slotEnd,
    duration: 60,
    price: 690,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    employee: {
      id: 'preview-employee',
      name: 'Josef',
      avatarUrl: null,
    },
    branch: {
      id: 'd15ee0b6-2e66-4edf-a4d1-5f87a89535a3',
      name: 'Modřany',
      address: 'Čs. exilu 40, Praha 12',
    },
    item: {
      id: 'preview-item',
      name: 'Střih + vousy',
    },
    ...overrides,
  };
}

/** Mock rezervace pro preview Live Activity v dev buildu. */
export function createBookingLiveActivityPreviewBooking(
  overrides?: Partial<Booking>
): Booking {
  const appointmentDate = new Date(Date.now() + 90 * 60 * 1000);
  return createBookingLiveActivityPreviewBookingAt(appointmentDate, overrides);
}
