import { router } from 'expo-router';
import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import MapView, { Marker } from 'react-native-maps';

import type { Locale } from '@/contexts/LanguageContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import BranchAddress from '@/components/shared/BranchAddress';
import Favorite from '@/components/Favorite';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import ProfileActionsMenu from '@/components/profile/ProfileActionsMenu';
import { ProfileActionsSheet } from '@/components/profile/ProfileActionsSheet';
import { ProfileShareSheet } from '@/components/profile/ProfileShareSheet';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { SEO_STARTER_WEB_ORIGIN } from '@/constants/bookingMonitor';
import { getBranchContactMeta } from '@/constants/branchContacts';
import { branchDetailHref } from '@/constants/profileDetailRoutes';
import {
  getBranchInteriorCarouselImages,
  type BranchInteriorCarouselImage} from '@/constants/branchInteriorGallery';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { resolveCrmBranchId } from '@/constants/crmBranchIds';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';
import type { TranslationKey } from '@/locales';
import { groupNearestBranchSlots, type NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import {
  buildBranchBookingHref,
  buildBranchShareCopy,
  getBranchGoogleReviewUrlForCrmId} from '@/utils/branchShareHelpers';
import { formatTravelDistanceMeters } from '@/utils/formatTravelDistanceMeters';
import { formatTravelDurationMinutes } from '@/utils/formatTravelDurationSeconds';
import { openBranchMapsApp } from '@/utils/branchDetailHelpers';
import { interpolateTemplate, MENU_SHARE_OPEN_DELAY_MS } from '@/utils/profileShareLinks';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

const SHEET_HORIZONTAL_PAD = 16;

export interface BranchQuickSheetProps {
  branchInternalId: BranchInternalId | null;
  branchTravel: NearestApiBranch | null;
  slots?: NearestBranchHomeSlot[];
  slotsLoading?: boolean;
  locale: Locale;
  t: (key: TranslationKey) => string;
  loading?: boolean;
  errorMessage?: string | null;
  onClose?: () => void;
}

function BranchQuickTravelRow({
  icon,
  label,
  onPress,
  isLast = false}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-2 active:opacity-70 ${isLast ? '' : 'mb-0.5'}`}>
      <View className="w-6 shrink-0 items-center justify-center">
        <Icon name={icon} size={20} className="text-light-text dark:text-dark-text" />
      </View>
      <ThemedText className="min-w-0 flex-1 text-sm leading-5 text-light-text dark:text-dark-text">
        {label}
      </ThemedText>
    </Pressable>
  );
}

function buildTravelRows(
  branchTravel: NearestApiBranch,
  locale: Locale,
  t: (key: TranslationKey) => string,
  onOpenNavigate: () => void
) {
  const rows: { key: string; icon: React.ComponentProps<typeof Icon>['name']; label: string }[] =
    [];

  if (branchTravel.drive) {
    rows.push({
      key: 'distance',
      icon: 'MapPin',
      label: interpolateTemplate(t('nearestBranchTravelFromYou'), {
        distance: formatTravelDistanceMeters(branchTravel.drive.distanceMeters, locale)})});
    rows.push({
      key: 'drive',
      icon: 'Car',
      label: `${interpolateTemplate(t('nearestBranchTravelDrive'), {
        minutes: String(formatTravelDurationMinutes(branchTravel.drive.durationSeconds))})}${branchTravel.drive.trafficAware ? t('nearestBranchTravelTrafficSuffix') : ''}`});
  }
  if (branchTravel.bicycle) {
    rows.push({
      key: 'bike',
      icon: 'Bike',
      label: interpolateTemplate(t('nearestBranchTravelBicycle'), {
        minutes: String(formatTravelDurationMinutes(branchTravel.bicycle.durationSeconds))})});
  }
  if (branchTravel.walk) {
    rows.push({
      key: 'walk',
      icon: 'Footprints',
      label: interpolateTemplate(t('nearestBranchTravelWalk'), {
        minutes: String(formatTravelDurationMinutes(branchTravel.walk.durationSeconds))})});
  }

  return rows.map((row, index) => (
    <BranchQuickTravelRow
      key={row.key}
      icon={row.icon}
      label={row.label}
      onPress={onOpenNavigate}
      isLast={index === rows.length - 1}
    />
  ));
}

function BranchQuickSheetContent({
  branchInternalId,
  branchTravel,
  branchMeta,
  crmBranchId,
  slotGroups,
  slotsLoading = false,
  locale,
  shareUrl,
  shareCopy,
  t,
  mediaTileWidth,
  mediaTileHeight,
  interiorImages,
  onOpenBranchDetail,
  onOpenNavigate,
  onOpenCallUs,
  onLeaveFlow,
  actionsSheetRef,
  shareSheetRef}: {
  branchInternalId: BranchInternalId;
  branchTravel: NearestApiBranch;
  branchMeta: ReturnType<typeof getBranchContactMeta>;
  crmBranchId: string;
  slotGroups: { dayLabel: string; slots: NearestBranchHomeSlot[] }[];
  slotsLoading?: boolean;
  locale: Locale;
  shareUrl: string;
  shareCopy: { title: string; emailSubject: string; emailBody: string };
  t: (key: TranslationKey) => string;
  mediaTileWidth: number;
  mediaTileHeight: number;
  interiorImages: BranchInteriorCarouselImage[];
  onOpenBranchDetail: () => void;
  onOpenNavigate: () => void;
  onOpenCallUs: () => void;
  onLeaveFlow: () => void;
  actionsSheetRef: React.RefObject<ActionSheetRef | null>;
  shareSheetRef: React.RefObject<ActionSheetRef | null>;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
      <View className="px-4 pb-8 pt-2">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Pressable onPress={onOpenBranchDetail} className="self-start active:opacity-70">
              <ThemedText className="text-2xl font-semibold leading-8" numberOfLines={1}>
                {branchMeta.shortLabel}
              </ThemedText>
            </Pressable>

            <BranchAddress address={branchMeta.address} className="mt-2" />

            <View className="mt-4">
              <BranchOpenStatusRow t={t} />
            </View>
          </View>

          <View className="shrink-0 flex-row items-center gap-0.5">
            <Favorite
              productName={branchMeta.shortLabel}
              title={branchMeta.shortLabel}
              entityType="branch"
              entityId={crmBranchId}
              size={22}
              nestedSheets
            />
            <ProfileActionsMenu
              mode="branch"
              displayName={branchMeta.shortLabel}
              shareUrl={shareUrl}
              shareTitle={shareCopy.title}
              shareEmailSubject={shareCopy.emailSubject}
              shareEmailBody={shareCopy.emailBody}
              rateUrl={getBranchGoogleReviewUrlForCrmId(crmBranchId)}
              bookingHref={buildBranchBookingHref(crmBranchId)}
              actionsSheetRef={actionsSheetRef}
              shareSheetRef={shareSheetRef}
              onLeaveFlow={onLeaveFlow}
              t={t}
            />
          </View>
        </View>

        <View className="mt-5 gap-3">
          <View className={interiorImages.length > 0 ? 'flex-row gap-2' : ''}>
            <Pressable
              onPress={() =>
                openBranchMapsApp(branchMeta.shortLabel, {
                  address: branchMeta.address,
                  latitude: branchMeta.latitude,
                  longitude: branchMeta.longitude})
              }
              className={`overflow-hidden rounded-2xl bg-black ${
                interiorImages.length > 0 ? 'min-w-0 flex-1' : 'w-full'
              }`}
              style={{ aspectRatio: 16 / 10 }}>
              <MapView
                style={{ flex: 1 }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                initialRegion={{
                  latitude: branchMeta.latitude,
                  longitude: branchMeta.longitude,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012}}>
                <Marker
                  coordinate={{
                    latitude: branchMeta.latitude,
                    longitude: branchMeta.longitude}}
                  title={branchMeta.shortLabel}
                />
              </MapView>
            </Pressable>
            {interiorImages.length > 0 ? (
              <View
                className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-black"
                style={{ aspectRatio: 16 / 10 }}>
                <ImageCarousel
                  key={branchInternalId}
                  images={interiorImages}
                  width={mediaTileWidth}
                  height={mediaTileHeight}
                  showPagination={interiorImages.length > 1}
                  paginationPlacement="overlay"
                  autoPlay={interiorImages.length > 1}
                  autoPlayInterval={3000}
                  loop
                  rounded="none"
                  imageBackgroundColor="#000000"
                />
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <View className="min-w-0 flex-1">
              <AppButton
                title={t('nearestBranchOpen')}
                variant="outline"
                size="sm"
                rounded="full"
                fullWidth
                className="px-3 py-2"
                iconStart="ExternalLink"
                iconSize={14}
                textClassName="text-xs font-semibold"
                onPress={onOpenBranchDetail}
              />
            </View>
            <View className="min-w-0 flex-1">
              <AppButton
                title={t('branchNavigateSectionTitle')}
                variant="outline"
                size="sm"
                rounded="full"
                fullWidth
                className="px-3 py-2"
                iconStart="Navigation"
                iconSize={14}
                textClassName="text-xs font-semibold"
                onPress={onOpenNavigate}
              />
            </View>
            <View className="min-w-0 flex-1">
              <AppButton
                title={t('barberPhoneCall')}
                variant="outline"
                size="sm"
                rounded="full"
                fullWidth
                className="px-3 py-2"
                iconStart="Phone"
                iconSize={14}
                textClassName="text-xs font-semibold"
                onPress={onOpenCallUs}
              />
            </View>
          </View>

          {branchTravel.drive || branchTravel.bicycle || branchTravel.walk ? (
            <View>{buildTravelRows(branchTravel, locale, t, onOpenNavigate)}</View>
          ) : null}

          <View>
            <ThemedText className="mb-3 text-base font-semibold leading-6">
              {t('nearestBranchSlotsTitle')}
            </ThemedText>
            {slotsLoading ? (
              <View className="items-start py-1">
                <SiteLoadingSpinner size="compact" />
              </View>
            ) : slotGroups.length === 0 ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('nearestBranchSlotsEmpty')}
              </ThemedText>
            ) : (
              <View className="gap-4">
                {slotGroups.map((group) => (
                  <View key={group.slots[0]?.date ?? group.dayLabel}>
                    <ThemedText className="mb-2 text-sm font-medium text-light-subtext dark:text-dark-subtext">
                      {group.dayLabel}
                    </ThemedText>
                    <View className="flex-row flex-wrap items-start">
                      {group.slots.map((slot) => (
                        <SlotTimePill
                          key={`${slot.date}-${slot.time}-${slot.employeeId}`}
                          compact
                          spaced
                          title={`${formatNextSlotDisplayTime(slot.time)} · ${slot.employeeName}`}
                          onPress={() => {
                            onLeaveFlow();
                            void startBarberSlotHandoffBooking({
                              employeeId: slot.employeeId,
                              employeeName: slot.employeeName,
                              branchId: slot.branchId,
                              branchName: slot.branchName,
                              branchAddress: slot.branchAddress,
                              date: slot.date,
                              slotStart: slot.time,
                              slotEnd: slot.endTime || undefined}).catch(() => {});
                          }}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export const BranchQuickSheet = forwardRef<ActionSheetRef, BranchQuickSheetProps>(
  function BranchQuickSheet(
    {
      branchInternalId,
      branchTravel,
      slots = [],
      slotsLoading = false,
      locale,
      t,
      loading = false,
      errorMessage = null,
      onClose},
    ref
  ) {
    const { width: screenWidth } = useWindowDimensions();
    const navigateRef = useRef<ActionSheetRef>(null);
    const callUsRef = useRef<ActionSheetRef>(null);
    const actionsRef = useRef<ActionSheetRef>(null);
    const shareRef = useRef<ActionSheetRef>(null);

    const todayIso = useMemo(() => getPragueTodayDateString(), []);
    const branchMeta = branchInternalId ? getBranchContactMeta(branchInternalId) : null;
    const crmBranchId = branchInternalId ? resolveCrmBranchId(branchInternalId) : '';
    const slotGroups = useMemo(
      () => groupNearestBranchSlots(slots, locale, todayIso),
      [slots, locale, todayIso]
    );

    const shareUrl = useMemo(() => {
      if (!branchInternalId) return '';
      const prefix = locale === 'cs' ? '' : `/${locale}`;
      return `${SEO_STARTER_WEB_ORIGIN}${prefix}/pobocky/${branchInternalId}`;
    }, [branchInternalId, locale]);

    const shareCopy = useMemo(
      () =>
        branchInternalId && shareUrl
          ? buildBranchShareCopy(branchMeta?.shortLabel ?? branchTravel?.name ?? '', shareUrl, locale)
          : { title: '', emailSubject: '', emailBody: '' },
      [branchInternalId, shareUrl, branchMeta?.shortLabel, branchTravel?.name, locale]
    );

    const interiorImages = useMemo(
      () => (branchInternalId ? getBranchInteriorCarouselImages(branchInternalId) : []),
      [branchInternalId]
    );

    const hasInteriorGallery = interiorImages.length > 0;
    const mediaTileWidth = useMemo(() => {
      const contentWidth = screenWidth - SHEET_HORIZONTAL_PAD * 2;
      if (hasInteriorGallery) {
        return Math.floor((contentWidth - 8) / 2);
      }
      return Math.floor(contentWidth);
    }, [screenWidth, hasInteriorGallery]);
    const mediaTileHeight = Math.round((mediaTileWidth * 10) / 16);

    const leaveFlow = useCallback(() => {
      if (typeof ref === 'function') return;
      ref?.current?.hide();
    }, [ref]);

    const branchBookingHref = crmBranchId ? buildBranchBookingHref(crmBranchId) : '';
    const branchRateUrl = crmBranchId ? getBranchGoogleReviewUrlForCrmId(crmBranchId) : null;

    const openActionsShare = useCallback(() => {
      actionsRef.current?.hide();
      setTimeout(() => {
        shareRef.current?.show();
      }, MENU_SHARE_OPEN_DELAY_MS);
    }, []);

    const handleActionsRate = useCallback(() => {
      actionsRef.current?.hide();
      if (!branchRateUrl) return;
      setTimeout(() => {
        void Linking.openURL(branchRateUrl).catch(() => {});
      }, MENU_SHARE_OPEN_DELAY_MS);
    }, [branchRateUrl]);

    const handleActionsBook = useCallback(() => {
      actionsRef.current?.hide();
      leaveFlow();
      if (!branchBookingHref) return;
      router.push(branchBookingHref as never);
    }, [branchBookingHref, leaveFlow]);

    const openNavigate = () => navigateRef.current?.show();
    const openCallUs = () => callUsRef.current?.show();

    const openBranchDetail = () => {
      if (!crmBranchId) return;
      leaveFlow();
      router.push(branchDetailHref(crmBranchId) as never);
    };

    const resolvedTravel =
      branchTravel ??
      (branchInternalId
        ? {
            id: branchInternalId,
            name: branchMeta?.shortLabel ?? '',
            drive: null,
            walk: null,
            bicycle: null}
        : null);

    return (
      <>
        <ActionSheetThemed ref={ref} gestureEnabled snapPoints={[100]} onClose={onClose}>
          {errorMessage ? (
            <View className="px-4 pb-8 pt-2">
              <ThemedText className="py-6 text-left text-sm text-light-subtext dark:text-dark-subtext">
                {errorMessage}
              </ThemedText>
            </View>
          ) : null}

          {!errorMessage && loading && !branchInternalId ? (
            <View className="px-4 pb-8 pt-2">
              <ThemedText className="py-6 text-left text-sm text-light-subtext dark:text-dark-subtext">
                {t('nearestBranchLoading')}
              </ThemedText>
            </View>
          ) : null}

          {!errorMessage && branchInternalId && branchMeta && resolvedTravel ? (
            <BranchQuickSheetContent
              branchInternalId={branchInternalId}
              branchTravel={resolvedTravel}
              branchMeta={branchMeta}
              crmBranchId={crmBranchId}
              slotGroups={slotGroups}
              slotsLoading={slotsLoading}
              locale={locale}
              shareUrl={shareUrl}
              shareCopy={shareCopy}
              t={t}
              mediaTileWidth={mediaTileWidth}
              mediaTileHeight={mediaTileHeight}
              interiorImages={interiorImages}
              onOpenBranchDetail={openBranchDetail}
              onOpenNavigate={openNavigate}
              onOpenCallUs={openCallUs}
              onLeaveFlow={leaveFlow}
              actionsSheetRef={actionsRef}
              shareSheetRef={shareRef}
            />
          ) : null}

          <BranchNavigateSheet
            nested
            ref={navigateRef}
            branchName={branchMeta?.shortLabel}
            address={branchMeta?.address}
            latitude={branchMeta?.latitude}
            longitude={branchMeta?.longitude}
          />
          <OperatorSupportSheet nested ref={callUsRef} variant="callUs" />
          <ProfileActionsSheet
            nested
            ref={actionsRef}
            title={t('branchMenuOpen')}
            bookLabel={t('branchMenuBook')}
            onShare={openActionsShare}
            onRate={handleActionsRate}
            onBook={handleActionsBook}
          />
          <ProfileShareSheet
            nested
            ref={shareRef}
            displayName={branchMeta?.shortLabel ?? ''}
            shareUrl={shareUrl}
            title={shareCopy.title}
            emailSubject={shareCopy.emailSubject}
            emailBody={shareCopy.emailBody}
          />
        </ActionSheetThemed>
      </>
    );
  }
);
