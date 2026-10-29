import type { Booking, BookingManage } from '@/api/bookings';
import type { PublicManagedReservation } from '@/utils/reservationManageParse';

/** Mapování public manage → stejný tvar jako client booking detail (sdílené UI). */
export function bookingFromManagedReservation(reservation: PublicManagedReservation): Booking {
  return {
    id: reservation.id,
    clientId: reservation.client?.id?.trim() ?? '',
    employeeId: reservation.employee.id,
    branchId: reservation.branch.id,
    itemId: reservation.item.id,
    date: reservation.date,
    slotStart: reservation.slotStart,
    slotEnd: reservation.slotEnd,
    duration: reservation.duration,
    price: reservation.price,
    status: reservation.status,
    notes: reservation.notes ?? null,
    createdAt: '',
    updatedAt: '',
    employee: {
      id: reservation.employee.id,
      name: reservation.employee.name,
      avatarUrl: reservation.employee.avatarUrl ?? null,
    },
    branch: {
      id: reservation.branch.id,
      name: reservation.branch.name,
      address: reservation.branch.address ?? undefined,
      phone: reservation.branch.phone ?? undefined,
    },
    item: {
      id: reservation.item.id,
      name: reservation.item.name,
      imageUrl: reservation.item.imageUrl ?? null,
    },
    canManage: reservation.canManage,
    manage: {
      lifecycle: reservation.manage.lifecycle,
      allowedActions: reservation.manage.allowedActions,
      canManage: reservation.manage.canManage,
      message: reservation.manage.message ?? null,
      timezone: reservation.manage.timezone ?? undefined,
      confirmAvailableFrom: reservation.manage.confirmAvailableFrom ?? undefined,
    } satisfies BookingManage,
  };
}
