import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Image, Pressable, Linking, Alert } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useLocalSearchParams, router } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedFooter from '@/components/ThemeFooter';
import Section from '@/components/layout/Section';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import Divider from '@/components/layout/Divider';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { getBookings, cancelBooking, type Booking } from '../../api/bookings';
import { getBranches, type Branch, type BranchService } from '@/api/branches';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { useTranslation } from '@/app/hooks/useTranslation';

const BRANCH_IMAGES: Record<string, number> = {
  'Modřany': require('@/assets/img/branches/Modrany.jpg'),
  'Kačerov': require('@/assets/img/branches/Kacerov.jpg'),
  'Hagibor': require('@/assets/img/branches/Hagibor.jpg'),
  'Barrandov': require('@/assets/img/branches/Barrandov.jpg'),
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
  servicesList.forEach((svc) => { if (svc.imageUrl) out.push(svc.imageUrl); });
  if (out.length === 0 && branch.name && BRANCH_IMAGES[branch.name] != null) {
    out.push(BRANCH_IMAGES[branch.name]);
  }
  if (out.length === 0) out.push(require('@/assets/img/branches/Modrany.jpg'));
  return out;
}

function getPaymentMethodLabel(method: string | null | undefined, t: (key: string) => string): string {
  if (!method) return '—';
  const normalized = method.trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'CASH') return t('paymentMethodCash');
  if (normalized === 'CARD' || normalized === 'CREDIT_CARD' || normalized === 'DEBIT_CARD') return t('paymentMethodCard');
  if (normalized === 'RBC' || normalized === 'RB_COINS' || normalized === 'RBCOINS') return t('paymentMethodRbc');
  return method
    .split('_')
    .map((part) => (part.toLowerCase() === 'rbc' ? 'RBC' : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

function formatAppointment(b: Booking): { dateStr: string; fromTime: string; toTime: string } {
  const d = new Date(b.date);
  const dateStr = `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
  return {
    dateStr,
    fromTime: b.slotStart,
    toTime: b.slotEnd,
  };
}

function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

function isBookingPast(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}

const BookingDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const setTransferRecipient = useSetTransferRecipient();
  const cancelSheetRef = useRef<ActionSheetRef>(null);
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
    getBookings(apiToken, { limit: 50 })
      .then((res) => {
        const found = res.bookings.find((b) => b.id === id) ?? null;
        setBooking(found);
        if (!found) setError('Booking not found');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

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
        const withReviews = overview?.data?.reservations?.withReviews as ClientOverviewReservation[] | undefined;
        const has = Array.isArray(withReviews) && withReviews.some((r) => r.id === id);
        setHasReview(!!has);
      })
      .catch(() => setHasReview(false));
  }, [apiToken, id]);

  if (loading) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header title={t('bookingDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Booking not found'}</ThemedText>
        </View>
      </>
    );
  }

  const appointment = formatAppointment(booking);
  const location = booking.branch?.address ?? booking.branch?.name ?? '—';
  const status = (booking.status ?? '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'canceled';
  const isPast = isBookingPast(booking);
  const isUpcoming = !isCancelled && !isPast;
  const cancelMessage = `${t('tripDetailCancelConfirmIntro')} ${appointment.dateStr} ${appointment.fromTime} ${t('tripDetailCancelConfirmAtBranch')} ${booking.branch?.name ?? '—'}.`;
  const carouselImages =
    branch != null
      ? branchImages(branch)
      : booking.branch?.name && BRANCH_IMAGES[booking.branch.name] != null
        ? [BRANCH_IMAGES[booking.branch.name]]
        : [require('@/assets/img/branches/Modrany.jpg')];

  return (
    <>
      <Header title={t('bookingDetailTitle')} showBackButton />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={carouselImages}
            />
          </View>

          <View className="px-global pt-6 pb-4">
            <ThemedText className="text-2xl font-bold mb-2">{booking.branch?.name ?? '—'}</ThemedText>
            <View className="flex-row items-center">
              <Icon name="MapPin" size={16} className="mr-2 text-light-subtext dark:text-dark-subtext" />
              <ThemedText className="text-light-subtext dark:text-dark-subtext">{location}</ThemedText>
            </View>
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingInCareOf')} titleSize="lg" className="px-global pt-4">
            <View className="flex-row items-center justify-between mt-4 mb-4">
              <View className="flex-row items-center flex-1">
                <Avatar src={booking.employee?.avatarUrl ?? undefined} name={booking.employee?.name} size="lg" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-lg font-semibold">{booking.employee?.name ?? '—'}</ThemedText>
                  {booking.item?.name ? (
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                      {booking.item.name}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </View>
            <ListLink
              icon="MessageCircle"
              title={t('bookingMessage')}
              description={t('bookingMessage')}
              href="/screens/chat/user"
              showChevron
              className="px-4 py-3 bg-light-secondary dark:bg-dark-secondary rounded-xl"
            />
            <ListLink
              icon="Gift"
              title={t('bookingSendRbcTip')}
              description={t('bookingSendRbcTip')}
              showChevron
              className="px-4 py-3 bg-light-secondary dark:bg-dark-secondary rounded-xl mt-2"
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
              <View className="flex-row items-center justify-between bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('bookingFrom')}</ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.fromTime}</ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('bookingTo')}</ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.toTime}</ThemedText>
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-2">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('bookingDuration')}</ThemedText>
                  <ThemedText className="text-lg font-semibold">{booking.duration} min</ThemedText>
                </View>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingReservationDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <Image
                source={booking.item?.imageUrl ? { uri: booking.item.imageUrl } : require('@/assets/img/room-1.avif')}
                className="w-32 h-32 rounded-xl mb-3"
                resizeMode="cover"
              />
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('bookingReservationNumber')}</ThemedText>
                <ThemedText className="font-medium">#{booking.id.slice(0, 8)}</ThemedText>
              </View>
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('bookingStatus')}</ThemedText>
                <ThemedText className="font-medium capitalize">{booking.status}</ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingPriceDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">{booking.item?.name ?? 'Service'}</ThemedText>
                <ThemedText>{booking.price} Kč</ThemedText>
              </View>
              <Divider className="my-3" />
              <View className="flex-row justify-between">
                <ThemedText className="font-bold text-lg">{t('bookingTotal')}</ThemedText>
                <ThemedText className="font-bold text-lg">{booking.price} Kč</ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('bookingPaymentMethod')} titleSize="lg" className="px-global pt-4">
            <View className="flex-row items-center mt-4">
              <Icon name="CreditCard" size={20} className="mr-3" />
              <View>
                <ThemedText className="font-medium">
                  {getPaymentMethodLabel(booking.paymentMethod, t)}
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {booking.price} Kč
                </ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('tripDetailLocation')}
            titleSize="lg"
            className="px-global pt-4 pb-6"
            header={
              <View className="flex-row items-center justify-between w-full">
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
            }
          >
            <View className="mt-4">
              <Pressable
                onPress={() => {
                  if (location && location !== '—') {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`);
                  }
                }}
                className="mb-4"
              >
                <ThemedText className="text-light-subtext dark:text-dark-subtext underline">{location}</ThemedText>
              </Pressable>
              {booking.branch?.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${booking.branch!.phone!.replace(/\s/g, '')}`)}>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext underline">{booking.branch.phone}</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <ThemedFooter>
        <View className="flex-row gap-3">
          {isPast && (
            <View className="flex-row gap-3 flex-1">
              <Button
                title={t('tripDetailRepeatReservation')}
                variant="outline"
                iconStart="CalendarPlus"
                className="flex-1"
                href={booking.branchId ? `/screens/branch-detail?id=${encodeURIComponent(booking.branchId)}` : undefined}
              />
              <Button
                title={hasReview ? t('reviewUpdate') : t('branchReview')}
                variant="outline"
                iconStart="Star"
                className="flex-1"
                href={`/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? booking.branch?.name ?? 'Booking')}${booking.item?.imageUrl ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}` : ''}${booking.employee?.name ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}` : ''}${booking.employee?.avatarUrl ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}` : ''}`}
              />
            </View>
          )}
          {isUpcoming && (
            <View className="flex-row gap-3 flex-1">
              <Button
                title={t('tripDetailMoveButton')}
                variant="outline"
                iconStart="Calendar"
                className="flex-1"
                href={`/screens/reschedule?id=${encodeURIComponent(booking.id)}`}
              />
              <Button
                title={t('tripDetailCancelButton')}
                variant="outline"
                iconStart="X"
                className="flex-1"
                onPress={() => cancelSheetRef.current?.show()}
              />
            </View>
          )}
        </View>
      </ThemedFooter>
      {isUpcoming && (
        <ConfirmationModal
          actionSheetRef={cancelSheetRef}
          title={t('tripDetailCancelBooking')}
          message={cancelMessage}
          optionalReasonPlaceholder={t('tripDetailCancelReasonPlaceholder')}
          quickReasons={[
            t('cancelReasonOtherTerm'),
            t('cancelReasonNoTime'),
            t('cancelReasonChangeOfPlans'),
          ]}
          cancelText={t('tripDetailCancelNo')}
          confirmText={t('tripDetailCancelYes')}
          onCancel={() => {}}
          onConfirm={(reason) => {
            if (!apiToken) return;
            cancelBooking(apiToken, booking.id, reason)
              .then(() => {
                router.back();
              })
              .catch((e) => {
                Alert.alert(t('tripDetailCancelError'), e instanceof Error ? e.message : String(e));
              });
          }}
        />
      )}
    </>
  );
};

export default BookingDetailScreen;
