import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  confirmBooking,
  getBookingById,
  normalizeBookingCouponUsages,
  type Booking,
} from '@/api/bookings';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import { getBranches, type Branch } from '@/api/branches';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { buildReservationReviewContextQuery } from '@/utils/bookingDetailHelpers';
import {
  isBookingCancelledLike,
  isBookingCurrent,
  isBookingMarkedCompleted,
  isBookingPast,
} from '@/utils/bookingHelpers';
import {
  clearFreshBookingSnapshotIfMatches,
  peekFreshBookingSnapshot,
} from '@/utils/freshBookingSnapshot';
import { mergeApiBookingWithOptimistic } from '@/utils/optimisticBooking';
import { isKidsHaircutBooking } from '@/utils/isKidsHaircutBooking';
import { clearPendingCalendarPromo, peekPendingCalendarPromo } from '@/utils/pendingCalendarPromo';
import {
  clearPendingKidsWatchPromo,
  peekPendingKidsWatchPromo,
} from '@/utils/pendingKidsWatchPromo';
import {
  clearPendingStoreReviewAfterBooking,
  consumePendingStoreReviewAfterBooking,
  peekPendingStoreReviewAfterBooking,
} from '@/utils/pendingStoreReview';
import { maybeRequestAppStoreReview } from '@/utils/appStoreReview';

export function useBookingDetailScreen(params: {
  id: string;
  openReview?: string;
  justBooked?: string | string[];
}) {
  const { id, openReview, justBooked } = params;
  const { apiToken } = useAuth();
  const { refresh: refreshBookings } = useBookings();
  const { t } = useTranslation();

  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kidsPromoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didShowCalendarPromoRef = useRef(false);
  const didShowKidsWatchPromoRef = useRef(false);
  const didScheduleStoreReviewRef = useRef(false);
  const didAutoReviewRef = useRef(false);

  const [calendarPromoVisible, setCalendarPromoVisible] = useState(false);
  const [kidsWatchPromoVisible, setKidsWatchPromoVisible] = useState(false);
  /** Jednorázový vstup po nové dětské rezervaci — promo řádek na detailu (ne trvalá sekce). */
  const [kidsWatchFirstVisitPromoActive, setKidsWatchFirstVisitPromoActive] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);
  const [confirmAttendanceError, setConfirmAttendanceError] = useState<string | null>(null);
  const skipNextFocusRefreshRef = useRef(false);

  const refreshHasReviewFromOverview = useCallback(async () => {
    if (!apiToken || !id) {
      setHasReview(false);
      return;
    }
    try {
      const overview = await getClientOverview(apiToken);
      const withReviews = overview?.data?.reservations?.withReviews as
        | ClientOverviewReservation[]
        | undefined;
      const has = Array.isArray(withReviews) && withReviews.some((r) => r.id === id);
      setHasReview(!!has);
    } catch {
      setHasReview(false);
    }
  }, [apiToken, id]);

  const fetchBookingDetail = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!id) {
        if (!opts?.silent) setLoading(false);
        return;
      }
      if (!apiToken) {
        if (!opts?.silent) {
          setLoading(true);
          setError(null);
        }
        return;
      }
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const fromServer = await getBookingById(apiToken, id);
        const snapBeforeLoad = peekFreshBookingSnapshot(id);
        if (fromServer) {
          const merged = snapBeforeLoad
            ? mergeApiBookingWithOptimistic(fromServer, snapBeforeLoad)
            : fromServer;
          clearFreshBookingSnapshotIfMatches(id);
          setBooking(normalizeBookingCouponUsages(merged));
          setError(null);
          return;
        }

        if (snapBeforeLoad) {
          setBooking(normalizeBookingCouponUsages(snapBeforeLoad));
          setError(null);
          return;
        }

        if (!opts?.silent) {
          setBooking(null);
          setError(t('bookingNotFound'));
        }
      } catch (e) {
        const snap = peekFreshBookingSnapshot(id);
        if (snap) {
          setBooking(normalizeBookingCouponUsages(snap));
          setError(null);
          try {
            const retry = await getBookingById(apiToken, id);
            if (retry) {
              const snapRetry = peekFreshBookingSnapshot(id);
              const merged = snapRetry
                ? mergeApiBookingWithOptimistic(retry, snapRetry)
                : retry;
              clearFreshBookingSnapshotIfMatches(id);
              setBooking(normalizeBookingCouponUsages(merged));
            }
          } catch {
            /* nechat snapshot */
          }
        } else if (!opts?.silent) {
          setBooking(null);
          setError(e instanceof Error ? e.message : t('bookingLoadFailed'));
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [apiToken, id, t]
  );

  useEffect(() => {
    skipNextFocusRefreshRef.current = true;
    void fetchBookingDetail();
  }, [fetchBookingDetail]);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefreshRef.current) {
        skipNextFocusRefreshRef.current = false;
        return;
      }
      if (!apiToken || !id) return;
      void fetchBookingDetail({ silent: true });
      void refreshHasReviewFromOverview();
    }, [apiToken, id, fetchBookingDetail, refreshHasReviewFromOverview])
  );

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
    void refreshHasReviewFromOverview();
  }, [refreshHasReviewFromOverview]);

  useEffect(() => {
    setConfirmAttendanceError(null);
    setConfirmingAttendance(false);
  }, [id]);

  const onConfirmAttendance = useCallback(async () => {
    if (!apiToken || !booking?.id || confirmingAttendance) return;
    setConfirmingAttendance(true);
    setConfirmAttendanceError(null);
    try {
      const res = await confirmBooking(apiToken, booking.id);
      setBooking(normalizeBookingCouponUsages(res.booking));
      setConfirmAttendanceError(null);
      void refreshBookings({ force: true });
    } catch (e) {
      setConfirmAttendanceError(
        e instanceof Error ? e.message : t('bookingDetailConfirmError')
      );
    } finally {
      setConfirmingAttendance(false);
    }
  }, [apiToken, booking?.id, confirmingAttendance, refreshBookings, t]);

  useEffect(() => {
    didShowCalendarPromoRef.current = false;
    didShowKidsWatchPromoRef.current = false;
    didScheduleStoreReviewRef.current = false;
    setCalendarPromoVisible(false);
    setKidsWatchPromoVisible(false);
    setKidsWatchFirstVisitPromoActive(false);
  }, [id]);

  useEffect(() => {
    if (loading || !booking) return;

    if (!(Platform.OS === 'ios' || Platform.OS === 'android')) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      if (peekPendingKidsWatchPromo(booking.id)) clearPendingKidsWatchPromo();
      clearPendingStoreReviewAfterBooking();
      return;
    }

    const isCancelled = isBookingCancelledLike(booking);
    const isCompleted = isBookingMarkedCompleted(booking);
    const isCurrent = !isCancelled && isBookingCurrent(booking);
    const isPast = !isCancelled && !isCurrent && (isCompleted || isBookingPast(booking));
    if (isCancelled || isPast) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      if (peekPendingKidsWatchPromo(booking.id)) clearPendingKidsWatchPromo();
      clearPendingStoreReviewAfterBooking();
      return;
    }

    if (String(booking.id).trim().toLowerCase() !== String(id).trim().toLowerCase()) return;

    const justBookedRaw = Array.isArray(justBooked) ? justBooked[0] : justBooked;
    const fromUrl = String(justBookedRaw ?? '') === '1';

    const fromKidsMem = peekPendingKidsWatchPromo(booking.id);
    const isKids = isKidsHaircutBooking(booking);

    if (fromKidsMem) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      if (didShowKidsWatchPromoRef.current) return;

      setKidsWatchFirstVisitPromoActive(true);

      kidsPromoTimerRef.current = setTimeout(() => {
        kidsPromoTimerRef.current = null;
        if (didShowKidsWatchPromoRef.current) return;
        didShowKidsWatchPromoRef.current = true;
        clearPendingKidsWatchPromo();
        setKidsWatchPromoVisible(true);
      }, 400);

      return () => {
        if (kidsPromoTimerRef.current != null) {
          clearTimeout(kidsPromoTimerRef.current);
          kidsPromoTimerRef.current = null;
        }
      };
    }

    if (isKids) {
      if (peekPendingCalendarPromo(booking.id)) clearPendingCalendarPromo();
      return;
    }

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
  }, [
    loading,
    booking?.id,
    booking?.status,
    booking?.date,
    booking?.slotStart,
    booking?.slotEnd,
    booking?.itemId,
    booking?.item?.id,
    justBooked,
    id,
  ]);

  useEffect(() => {
    if (loading || !booking) return;
    if (!peekPendingStoreReviewAfterBooking()) return;
    if (didScheduleStoreReviewRef.current) return;

    const scheduleReview = () => {
      if (didScheduleStoreReviewRef.current) return;
      if (!consumePendingStoreReviewAfterBooking()) return;
      didScheduleStoreReviewRef.current = true;
      void maybeRequestAppStoreReview({ trigger: 'booking_created', delayMs: 500 });
    };

    if (calendarPromoVisible || kidsWatchPromoVisible || didShowKidsWatchPromoRef.current) return;

    if (didShowCalendarPromoRef.current || didShowKidsWatchPromoRef.current) {
      scheduleReview();
      return;
    }

    reviewTimerRef.current = setTimeout(() => {
      reviewTimerRef.current = null;
      if (didShowCalendarPromoRef.current) return;
      scheduleReview();
    }, 2500);

    return () => {
      if (reviewTimerRef.current != null) {
        clearTimeout(reviewTimerRef.current);
        reviewTimerRef.current = null;
      }
    };
  }, [loading, booking, calendarPromoVisible, kidsWatchPromoVisible]);

  useEffect(() => {
    if (calendarPromoVisible || kidsWatchPromoVisible) return;
    if (!didShowCalendarPromoRef.current && !didShowKidsWatchPromoRef.current) return;
    if (!peekPendingStoreReviewAfterBooking()) return;
    if (didScheduleStoreReviewRef.current) return;

    didScheduleStoreReviewRef.current = true;
    if (consumePendingStoreReviewAfterBooking()) {
      void maybeRequestAppStoreReview({ trigger: 'booking_created', delayMs: 500 });
    }
  }, [calendarPromoVisible, kidsWatchPromoVisible]);

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
      )}&entityName=${entityName}${imageParam}${employeeNameParam}${employeeAvatarParam}${buildReservationReviewContextQuery(booking)}`
    );
  }, [booking, openReview, hasReview]);

  const clearKidsWatchFirstVisitPromo = useCallback(() => {
    setKidsWatchFirstVisitPromoActive(false);
  }, []);

  return {
    booking,
    branch,
    hasReview,
    loading,
    error,
    calendarPromoVisible,
    setCalendarPromoVisible,
    kidsWatchPromoVisible,
    setKidsWatchPromoVisible,
    kidsWatchFirstVisitPromoActive,
    clearKidsWatchFirstVisitPromo,
    confirmingAttendance,
    confirmAttendanceError,
    onConfirmAttendance,
  };
}
