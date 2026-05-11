import { useLocalSearchParams, router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getBookings, getBookingById, cancelBooking, type Booking } from '../../api/bookings';

import { getBranches, type Branch, type BranchService } from '@/api/branches';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import { BranchNavigateSheet, getBranchNavigateMapsQuery } from '@/components/BranchNavigateSheet';
import { Button } from '@/components/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import ListLink from '@/components/ListLink';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import { addBookingToCalendar } from '@/utils/bookingCalendar';
import {
  clearFreshBookingSnapshotIfMatches,
  peekFreshBookingSnapshot,
} from '@/utils/freshBookingSnapshot';
import {
  clearPendingCalendarPromo,
  peekPendingCalendarPromo,
} from '@/utils/pendingCalendarPromo';
import {
  getBookingUiStatusTranslationKey,
  isBookingCurrent,
  isBookingMarkedCompleted,
  isBookingPast,
} from '@/utils/bookingHelpers';

const BRANCH_IMAGES: Record<string, number> = {
  Modřany: require('@/assets/img/branches/Modrany.jpg'),
  Kačerov: require('@/assets/img/branches/Kacerov.jpg'),
  Hagibor: require('@/assets/img/branches/Hagibor.jpg'),
  Barrandov: require('@/assets/img/branches/Barrandov.jpg'),
};

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

/** Same image list as branch-detail: media, imageUrl, service images; fallback to local BRANCH_IMAGES. */
function branchImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaUrls = getMediaUrlsSorted(branch.media);
  mediaUrls.forEach((url) => out.push(url));
  if (branch.imageUrl) out.push(branch.imageUrl);
  const servicesList = getServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0 && branch.name && BRANCH_IMAGES[branch.name] != null) {
    out.push(BRANCH_IMAGES[branch.name]);
  }
  if (out.length === 0) out.push(require('@/assets/img/branches/Modrany.jpg'));
  return out;
}

function formatAppointment(
  b: Booking,
  dateLocale: string
): { dateStr: string; fromTime: string; toTime: string } {
  const d = new Date(b.date);
  const monthShort = d.toLocaleString(dateLocale, { month: 'short' });
  const dateStr = `${d.getDate()} ${monthShort} ${d.getFullYear()}`;
  return {
    dateStr,
    fromTime: b.slotStart,
    toTime: b.slotEnd,
  };
}

/** Datum a čas jen pro text ve sheetu zrušení (CS: „29. 5 v 16:45“ z kalendářního data rezervace). */
function formatCancelSheetWhen(b: Booking, locale: string): string {
  const time = (b.slotStart || '').trim();
  const raw = (b.date || '').slice(0, 10);
  const nums = raw.split('-').map(Number);
  const y = nums[0];
  const m = nums[1];
  const d = nums[2];
  if (locale === 'cs' && Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    return `${d}. ${m} v ${time}`;
  }
  const dt = new Date(b.date);
  const monthShort = dt.toLocaleString('en-GB', { month: 'short' });
  return `${dt.getDate()} ${monthShort} ${dt.getFullYear()} at ${time}`;
}

const BookingDetailScreen = () => {
  const local = useLocalSearchParams<{
    id: string | string[];
    openReview?: string;
    justBooked?: string | string[];
  }>();
  const id = (Array.isArray(local.id) ? local.id[0] : local.id) ?? '';
  const openReview = local.openReview;
  const justBooked = local.justBooked;
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const setTransferRecipient = useSetTransferRecipient();
  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelSheetRef = useRef<ActionSheetRef>(null);
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const didShowCalendarPromoRef = useRef(false);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const [calendarPromoVisible, setCalendarPromoVisible] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didAutoReviewRef = useRef(false);

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
        const res = await getBookings(apiToken, { limit: 50 });
        if (cancelled) return;
        const found = res.bookings.find((b) => b.id === id) ?? null;
        if (found) {
          clearFreshBookingSnapshotIfMatches(id);
          setBooking(found);
          setError(null);
          return;
        }

        const snap = peekFreshBookingSnapshot(id);
        if (snap) {
          setBooking(snap);
          setError(null);
        }

        const fromServer = await getBookingById(apiToken, id);
        if (cancelled) return;
        if (fromServer) {
          clearFreshBookingSnapshotIfMatches(id);
          setBooking(fromServer);
          setError(null);
        } else if (!snap) {
          setBooking(null);
          setError(t('bookingNotFound'));
        }
      } catch (e) {
        if (cancelled) return;
        const snap = peekFreshBookingSnapshot(id);
        if (snap) {
          setBooking(snap);
          setError(null);
          try {
            const fromServer = await getBookingById(apiToken, id);
            if (!cancelled && fromServer) {
              clearFreshBookingSnapshotIfMatches(id);
              setBooking(fromServer);
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
        router.replace(`/screens/trip-detail?id=${encodeURIComponent(booking.id)}`);
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

  const handleAddToCalendar = useCallback(async () => {
    if (!booking) return;
    await addBookingToCalendar(booking, {
      noteBarberPrefix: t('bookingCalendarNoteBarber'),
      reservationNumberPrefix: t('bookingReservationNumber'),
      errorTitle: t('commonError'),
      errorMessage: t('bookingAddToCalendarFailed'),
    });
  }, [booking, t]);

  if (loading) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? t('bookingNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  const appointment = formatAppointment(booking, dateLocaleTag);
  const location = booking.branch?.address ?? booking.branch?.name ?? '—';
  const status = (booking.status ?? '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'canceled';
  const isCompleted = isBookingMarkedCompleted(booking);
  const isCurrent = !isCancelled && isBookingCurrent(booking);
  const isPast = !isCancelled && !isCurrent && (isCompleted || isBookingPast(booking));
  const isUpcoming = !isCancelled && !isCurrent && !isPast;
  const canOpenBranchNavigate =
    !isCancelled &&
    getBranchNavigateMapsQuery(
      booking.branch?.name ?? branch?.name,
      booking.branch?.address ?? branch?.address
    ) !== '';
  const canAddToCalendar =
    (Platform.OS === 'ios' || Platform.OS === 'android') && !isCancelled && !isPast;
  const cancelWhen = formatCancelSheetWhen(booking, locale);
  const cancelMessage = `${t('tripDetailCancelConfirmIntro')} ${cancelWhen} ${t('tripDetailCancelConfirmAtBranch')} ${booking.branch?.name ?? '—'}. ${t('tripDetailCancelConfirmNote')}`;
  const carouselImages =
    branch != null
      ? branchImages(branch)
      : booking.branch?.name && BRANCH_IMAGES[booking.branch.name] != null
        ? [BRANCH_IMAGES[booking.branch.name]]
        : [require('@/assets/img/branches/Modrany.jpg')];

  return (
    <>
      <Header title={t('bookingDetailTitle')} showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={carouselImages}
              scrollY={heroScrollY}
              stretchOnPullDown
            />
          </View>

          <View className="px-global pb-4 pt-6">
            <View className="mb-2 flex-row items-start justify-between gap-2">
              <ThemedText className="min-w-0 flex-1 shrink pr-1 text-2xl font-bold">
                {booking.branch?.name ?? '—'}
              </ThemedText>
              {canOpenBranchNavigate ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('branchNavigateSectionTitle')}
                  onPress={() => branchNavigateRef.current?.show()}
                  className="mt-0.5 h-9 w-[128px] shrink-0 flex-row items-center justify-center gap-1 rounded-full bg-light-secondary active:opacity-80 dark:bg-dark-secondary">
                  <Icon
                    name="Navigation"
                    size={14}
                    className="text-light-text dark:text-dark-text"
                  />
                  <ThemedText className="text-center text-sm font-semibold">
                    {t('branchNavigateSectionTitle')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            <View className="mb-2 flex-row items-start gap-2">
              <Icon
                name="MapPin"
                size={16}
                className="mt-0.5 shrink-0 text-light-subtext dark:text-dark-subtext"
              />
              <ThemedText className="min-w-0 flex-1 text-light-subtext leading-snug dark:text-dark-subtext">
                {location}
              </ThemedText>
            </View>
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingInCareOf')} titleSize="lg" className="px-global pt-4">
            <View className="mb-4 mt-4 flex-row items-center justify-between">
              <View className="min-w-0 flex-1 flex-row items-center">
                <Avatar
                  src={booking.employee?.avatarUrl ?? undefined}
                  name={booking.employee?.name}
                  size="lg"
                />
                <View className="ml-3 min-w-0 flex-1">
                  <ThemedText className="text-lg font-semibold">
                    {booking.employee?.name ?? '—'}
                  </ThemedText>
                  {booking.item?.name ? (
                    <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                      {booking.item.name}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              {booking.employee?.id ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('bookingOpenEmployeeProfile')}
                  hitSlop={12}
                  onPress={() =>
                    router.push(
                      `/screens/barber-detail?id=${encodeURIComponent(booking.employee!.id)}`
                    )
                  }
                  className="ml-2 shrink-0 rounded-full bg-light-secondary p-2.5 dark:bg-dark-secondary">
                  <Icon name="CircleUserRound" size={22} />
                </Pressable>
              ) : null}
            </View>
            <ListLink
              icon="Gift"
              title={t('bookingSendRbcTip')}
              description={t('bookingSendRbcTip')}
              showChevron
              className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
              onPress={() => {
                const emp = booking.employee;
                if (!emp?.id) return;
                setTransferRecipient({
                  id: emp.id,
                  name: emp.name ?? '—',
                  type: 'EMPLOYEE',
                  avatarUrl: emp.avatarUrl ?? undefined,
                });
                router.push(`/screens/transfer-chat/${emp.id}`);
              }}
            />
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingYourAppointment')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-4">
              <ThemedText className="text-lg font-semibold">{appointment.dateStr}</ThemedText>
              <View className="flex-row items-center justify-between rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('bookingFrom')}
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.fromTime}</ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('bookingTo')}
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.toTime}</ThemedText>
                </View>
              </View>
              {canAddToCalendar ? (
                <ListLink
                  icon="CalendarPlus"
                  title={t('bookingAddToCalendar')}
                  description={t('bookingAddToCalendarDescription')}
                  showChevron
                  className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
                  onPress={handleAddToCalendar}
                />
              ) : null}
              <View className="flex-row items-center justify-between pt-2">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('bookingDuration')}
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">
                    {booking.duration} {t('bookingMinutesShort')}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingReservationDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <Image
                source={
                  booking.item?.imageUrl
                    ? { uri: booking.item.imageUrl }
                    : require('@/assets/img/barbers.png')
                }
                className="mb-3 h-32 w-32 rounded-xl"
                contentFit="cover"
              />
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  {t('bookingReservationNumber')}
                </ThemedText>
                <ThemedText className="font-medium">#{booking.id.slice(0, 8)}</ThemedText>
              </View>
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  {t('bookingStatus')}
                </ThemedText>
                <ThemedText className="font-medium">{t(getBookingUiStatusTranslationKey(booking))}</ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingPriceDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  {booking.item?.name ?? t('bookingServiceFallback')}
                </ThemedText>
                <ThemedText>
                  {booking.price} {t('reservationCurrencySuffix')}
                </ThemedText>
              </View>
              <Divider className="my-3" />
              <View className="flex-row justify-between">
                <ThemedText className="text-lg font-bold">{t('bookingTotal')}</ThemedText>
                <ThemedText className="text-lg font-bold">
                  {booking.price} {t('reservationCurrencySuffix')}
                </ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('tripDetailLocation')}
            titleSize="lg"
            className="px-global pb-6 pt-4"
            header={
              <View className="w-full flex-row items-center justify-between">
                <ThemedText className="text-lg font-semibold">{t('tripDetailLocation')}</ThemedText>
                <Button
                  title={t('tripDetailFullMap')}
                  iconStart="Map"
                  variant="secondary"
                  size="small"
                  rounded="full"
                  href="/screens/map"
                  className="bg-light-secondary dark:bg-dark-secondary"
                />
              </View>
            }>
            <View className="mt-4">
              <Pressable
                onPress={() => {
                  if (location && location !== '—') {
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
                    );
                  }
                }}
                className="mb-4">
                <ThemedText className="text-light-subtext underline dark:text-dark-subtext">
                  {location}
                </ThemedText>
              </Pressable>
              {booking.branch?.phone ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${booking.branch!.phone!.replace(/\s/g, '')}`)
                  }>
                  <ThemedText className="text-sm text-light-subtext underline dark:text-dark-subtext">
                    {booking.branch.phone}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={booking.branch?.name ?? branch?.name}
        address={booking.branch?.address ?? branch?.address}
      />

      <ThemedFooter>
        <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          {isCancelled && (
            <View className="flex-1 flex-row items-center justify-center gap-2 py-3.5">
              <ThemedText className="text-sm font-semibold text-red-500 dark:text-red-400">Zrušená rezervace</ThemedText>
            </View>
          )}
          {isCurrent && (
            <View className="flex-1 flex-row items-center justify-center gap-2 py-3.5">
              <LiveIndicator variant="green" size="md" />
              <ThemedText className="text-sm font-semibold">
                {t('bookingStatusInProgress')}
              </ThemedText>
            </View>
          )}
          {isPast && (
            <>
              <Button
                variant="ghost"
                size="small"
                title={t('tripDetailRepeatReservation')}
                iconStart="CalendarPlus"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/reservation-create?branchId=${encodeURIComponent(booking.branchId)}&employeeId=${encodeURIComponent(booking.employeeId)}&itemId=${encodeURIComponent(booking.itemId)}&itemName=${encodeURIComponent(booking.item?.name ?? '')}`}
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              <Button
                variant="ghost"
                size="small"
                title={hasReview ? t('reviewUpdate') : t('branchReview')}
                iconStart="Star"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? booking.branch?.name ?? 'Booking')}${booking.item?.imageUrl ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}` : ''}${booking.employee?.name ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}` : ''}${booking.employee?.avatarUrl ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}` : ''}`}
              />
            </>
          )}
          {isUpcoming && (
            <>
              <Button
                variant="ghost"
                size="small"
                title={t('tripDetailMoveButton')}
                iconStart="Calendar"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                href={`/screens/reschedule?id=${encodeURIComponent(booking.id)}`}
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              <Button
                variant="ghost"
                size="small"
                title={t('tripDetailCancelButton')}
                iconStart="X"
                iconSize={16}
                className="min-w-0 flex-1 rounded-none px-0 py-3.5"
                textClassName="text-sm font-semibold text-red-600 dark:text-red-400"
                onPress={() => cancelSheetRef.current?.show()}
              />
            </>
          )}
        </View>
      </ThemedFooter>
      {isUpcoming && (
        <ConfirmationModal
          actionSheetRef={cancelSheetRef}
          title={t('tripDetailCancelBooking')}
          message={cancelMessage}
          cancelText={t('tripDetailCancelNo')}
          confirmText={t('tripDetailCancelYes')}
          onCancel={() => {}}
          onConfirm={() => {
            if (!apiToken) return;
            cancelBooking(apiToken, booking.id)
              .then(() => {
                router.back();
              })
              .catch((e) => {
                Alert.alert(t('tripDetailCancelError'), e instanceof Error ? e.message : String(e));
              });
          }}
        />
      )}
      <Modal
        visible={calendarPromoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarPromoVisible(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setCalendarPromoVisible(false)}>
          <Pressable
            className="gap-3 rounded-t-3xl px-4 pb-10 pt-4"
            style={{ backgroundColor: colors.sheet }}
            onPress={(e) => e.stopPropagation?.()}>
            <ThemedText className="mb-1 text-center text-base font-semibold">
              {t('tripDetailPostBookingCalendarTitle')}
            </ThemedText>
            <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
              {t('tripDetailPostBookingCalendarMessage')}
            </ThemedText>
            <Button
              title={t('bookingAddToCalendar')}
              onPress={() => {
                setCalendarPromoVisible(false);
                setTimeout(() => {
                  void addBookingToCalendar(booking, {
                    noteBarberPrefix: t('bookingCalendarNoteBarber'),
                    reservationNumberPrefix: t('bookingReservationNumber'),
                    errorTitle: t('commonError'),
                    errorMessage: t('bookingAddToCalendarFailed'),
                  });
                }, 320);
              }}
              variant="primary"
              iconStart="CalendarPlus"
            />
            <Button
              title={t('tripDetailPostBookingCalendarLater')}
              onPress={() => setCalendarPromoVisible(false)}
              variant="secondary"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default BookingDetailScreen;
