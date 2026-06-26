import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { createBooking, type Booking } from '@/api/bookings';
import type { Branch } from '@/api/branches';
import type { CouponPreviewSuccess } from '@/api/coupons';
import { useBookings } from '@/app/contexts/BookingsBadgeContext';
import { setFreshBookingSnapshot } from '@/utils/freshBookingSnapshot';
import { buildOptimisticBooking, mergeApiBookingWithOptimistic } from '@/utils/optimisticBooking';
import { setPendingCalendarPromo } from '@/utils/pendingCalendarPromo';
import { setPendingStoreReviewAfterBooking } from '@/utils/pendingStoreReview';
import type { ReservationFlowData, ServiceOption } from '@/utils/reservationCreateHelpers';

interface SelectedEmployeeSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface UseReservationSubmitParams {
  apiToken: string | null;
  clientId: string | undefined;
  data: ReservationFlowData;
  couponCodeInput: string;
  couponPreview: CouponPreviewSuccess | null;
  selectedService: ServiceOption | null;
  selectedEmployee: SelectedEmployeeSummary | null;
  branchForServiceStep: Branch | null;
}

export function useReservationSubmit({
  apiToken,
  clientId,
  data,
  couponCodeInput,
  couponPreview,
  selectedService,
  selectedEmployee,
  branchForServiceStep,
}: UseReservationSubmitParams) {
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingError, setCreateBookingError] = useState<string | null>(null);
  const { refresh: refreshBookings } = useBookings();

  const handleCreateBooking = useCallback(async () => {
    if (!apiToken || creatingBooking) return;
    setCreateBookingError(null);
    setCreatingBooking(true);
    try {
      const trimmedCoupon = couponCodeInput.trim();
      const verifiedCoupon =
        trimmedCoupon !== '' &&
        couponPreview !== null &&
        couponPreview.couponCode.trim().toLowerCase() === trimmedCoupon.toLowerCase();

      const payload = {
        employeeId: data.employeeId,
        branchId: data.branchId,
        itemId: data.itemId,
        date: data.date,
        slotStart: data.slotStart,
        slotEnd: data.slotEnd.trim() !== '' ? data.slotEnd : undefined,
        notes: '',
        ...(verifiedCoupon ? { couponCode: trimmedCoupon } : {}),
      };
      const created = await createBooking(apiToken, payload);
      await refreshBookings({ force: true });
      const createdId =
        (typeof created.id === 'string' ? created.id : undefined) ??
        (created.booking && typeof created.booking.id === 'string'
          ? created.booking.id
          : undefined);
      if (createdId) {
        const optimisticPrice =
          verifiedCoupon && couponPreview
            ? couponPreview.finalPrice
            : (selectedService?.price ?? 0);
        const fallback = buildOptimisticBooking({
          id: createdId,
          clientId: clientId ?? '',
          employeeId: data.employeeId,
          branchId: data.branchId,
          itemId: data.itemId,
          date: data.date,
          slotStart: data.slotStart,
          slotEnd: data.slotEnd.trim() !== '' ? data.slotEnd : undefined,
          duration: data.duration,
          price: optimisticPrice,
          branch: branchForServiceStep,
          employee: selectedEmployee
            ? {
                id: selectedEmployee.id,
                name: selectedEmployee.name,
                avatarUrl: selectedEmployee.avatarUrl ?? null,
              }
            : null,
          service: selectedService,
        });
        const merged =
          created.booking && typeof created.booking === 'object'
            ? mergeApiBookingWithOptimistic(
                created.booking as Partial<Booking> & { id?: string },
                fallback
              )
            : fallback;
        setFreshBookingSnapshot(merged);
        setPendingCalendarPromo(createdId);
        setPendingStoreReviewAfterBooking();
        router.replace(`/screens/booking-detail?id=${encodeURIComponent(createdId)}`);
      } else {
        router.replace('/bookings');
      }
    } catch (e) {
      setCreateBookingError(e instanceof Error ? e.message : 'Failed to create booking');
    } finally {
      setCreatingBooking(false);
    }
  }, [
    apiToken,
    creatingBooking,
    couponCodeInput,
    couponPreview,
    data,
    selectedService,
    clientId,
    branchForServiceStep,
    selectedEmployee,
    refreshBookings,
  ]);

  return {
    creatingBooking,
    createBookingError,
    handleCreateBooking,
  };
}
