import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { getBookingById, normalizeBookingCouponUsages, type Booking } from '@/api/bookings';
import { getBranches, type Branch } from '@/api/branches';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { isBookingCurrent, isBookingMarkedCompleted, isBookingPast } from '@/utils/bookingHelpers';
import {
  clearFreshBookingSnapshotIfMatches,
  peekFreshBookingSnapshot,
} from '@/utils/freshBookingSnapshot';
import { clearPendingCalendarPromo, peekPendingCalendarPromo } from '@/utils/pendingCalendarPromo';

export function useBookingDetailScreen(params: {
  id: string;
  openReview?: string;
  justBooked?: string | string[];
}) {
  const { id, openReview, justBooked } = params;
  const { apiToken } = useAuth();
  const { t } = useTranslation();

  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didShowCalendarPromoRef = useRef(false);
  const didAutoReviewRef = useRef(false);

  const [calendarPromoVisible, setCalendarPromoVisible] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let cancelled = false;

    (async () => {
      try {
        const fromServer = await getBookingById(apiToken, id);
        if (cancelled) return;
        if (fromServer) {
          clearFreshBookingSnapshotIfMatches(id);
          setBooking(fromServer);
          setError(null);
          return;
        }

        const snap = peekFreshBookingSnapshot(id);
        if (snap) {
          setBooking(normalizeBookingCouponUsages(snap));
          setError(null);
          return;
        }

        setBooking(null);
        setError(t('bookingNotFound'));
      } catch (e) {
        if (cancelled) return;
        const snap = peekFreshBookingSnapshot(id);
        if (snap) {
          setBooking(normalizeBookingCouponUsages(snap));
          setError(null);
          try {
            const retry = await getBookingById(apiToken, id);
            if (!cancelled && retry) {
              clearFreshBookingSnapshotIfMatches(id);
              setBooking(retry);
            }
          } catch {
            /* nechat snapshot */
          }
        } else {
          setBooking(null);
          setError(e instanceof Error ? e.message : t('bookingLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiToken, id, t]);

  useEffect(() => {
    if (!apiToken || !booking?.branchId) {
      setBranch(null);
      return;
    }
    getBranches(apiToken, { includeReviews: false })
      .then((list) => {
        const found = list.find((b) => b.id === booking.branchId) ?? null;
        setBranch(found);
      })
      .catch(() => setBranch(null));
  }, [apiToken, booking?.branchId]);

  useEffect(() => {
    if (!apiToken || !id) {
      setHasReview(false);
      return;
    }
    getClientOverview(apiToken)
      .then((overview) => {
        const withReviews = overview?.data?.reservations?.withReviews as
          | ClientOverviewReservation[]
          | undefined;
        const has = Array.isArray(withReviews) && withReviews.some((r) => r.id === id);
        setHasReview(!!has);
      })
      .catch(() => setHasReview(false));
  }, [apiToken, id]);

  useEffect(() => {
    didShowCalendarPromoRef.current = false;
    setCalendarPromoVisible(false);
  }, [id]);

  useEffect(() => {
    if (loading || !booking) return;

    if (!(Platform.OS === 'ios' || Platform.OS === 'android')) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      return;
    }

    const status = (booking.status ?? '').toLowerCase();
    const isCancelled = status === 'cancelled' || status === 'canceled';
    const isCompleted = isBookingMarkedCompleted(booking);
    const isCurrent = !isCancelled && isBookingCurrent(booking);
    const isPast = !isCancelled && !isCurrent && (isCompleted || isBookingPast(booking));
    if (isCancelled || isPast) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      return;
    }

    if (String(booking.id).trim().toLowerCase() !== String(id).trim().toLowerCase()) return;

    const justBookedRaw = Array.isArray(justBooked) ? justBooked[0] : justBooked;
    const fromUrl = String(justBookedRaw ?? '') === '1';
    const fromMem = peekPendingCalendarPromo(booking.id);

    if (!fromMem && !fromUrl) return;
    if (didShowCalendarPromoRef.current) return;

    promoTimerRef.current = setTimeout(() => {
      promoTimerRef.current = null;
      if (didShowCalendarPromoRef.current) return;
      didShowCalendarPromoRef.current = true;
      if (fromMem) clearPendingCalendarPromo();
      setCalendarPromoVisible(true);
      if (fromUrl) {
        router.replace(`/screens/booking-detail?id=${encodeURIComponent(booking.id)}`);
      }
    }, 400);

    return () => {
      if (promoTimerRef.current != null) {
        clearTimeout(promoTimerRef.current);
        promoTimerRef.current = null;
      }
    };
  }, [loading, booking, justBooked, id]);

  useEffect(() => {
    if (!booking) return;
    if (didAutoReviewRef.current) return;
    if (openReview !== '1') return;
    if (hasReview) return;
    if (!isBookingMarkedCompleted(booking)) return;

    didAutoReviewRef.current = true;
    const entityName = encodeURIComponent(booking.item?.name ?? booking.branch?.name ?? 'Booking');
    const imageParam = booking.item?.imageUrl
      ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
      : '';
    const employeeNameParam = booking.employee?.name
      ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}`
      : '';
    const employeeAvatarParam = booking.employee?.avatarUrl
      ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}`
      : '';

    router.replace(
      `/screens/review?entityType=reservation&entityId=${encodeURIComponent(
        booking.id
      )}&entityName=${entityName}${imageParam}${employeeNameParam}${employeeAvatarParam}`
    );
  }, [booking, openReview, hasReview]);

  return {
    booking,
    branch,
    hasReview,
    loading,
    error,
    calendarPromoVisible,
    setCalendarPromoVisible,
  };
}
