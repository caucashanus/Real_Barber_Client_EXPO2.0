import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import MapView, { Marker } from 'react-native-maps';

import type { Locale } from '@/app/contexts/LanguageContext';
import { useCopyFeedback } from '@/app/contexts/CopyFeedbackContext';
import { useNearestBranch } from '@/app/hooks/useNearestBranch';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
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
import {
  getBranchInteriorCarouselImages,
  type BranchInteriorCarouselImage,
} from '@/constants/branchInteriorGallery';
import { resolveCrmBranchId } from '@/constants/crmBranchIds';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';
import type { TranslationKey } from '@/locales';
import {
  buildNearestBranchSlotsByInternalId,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import {
  buildBranchBookingHref,
  buildBranchShareCopy,
  getBranchGoogleReviewUrlForCrmId,
} from '@/utils/branchShareHelpers';
import { formatTravelDistanceMeters } from '@/utils/formatTravelDistanceMeters';
import { formatTravelDurationMinutes } from '@/utils/formatTravelDurationSeconds';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';
import { openBranchMapsApp } from '@/utils/branchDetailHelpers';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { interpolateTemplate, MENU_SHARE_OPEN_DELAY_MS } from '@/utils/profileShareLinks';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const TILE_IMAGE = require('@/assets/img/branches.png');
const MAX_SLOTS = 16;
const SHEET_HORIZONTAL_PAD = 16;

interface HomeNearestBranchProps {
  teamCards: HomeTodayTeamCardModel[];
  locale: Locale;
  t: (key: TranslationKey) => string;
  homeRefreshing?: boolean;
}

function buildNearestHomeDetails(
  nearest: NearestApiBranch,
  branchLabel: string,
  locale: Locale,
  t: (key: TranslationKey) => string
): string {
  const parts: string[] = [branchLabel];

  const distanceMeters =
    nearest.drive?.distanceMeters ??
    nearest.bicycle?.distanceMeters ??
    nearest.walk?.distanceMeters ??
    null;

  if (distanceMeters != null) {
    parts.push(formatTravelDistanceMeters(distanceMeters, locale));
  }

  if (nearest.drive) {
    parts.push(
      interpolateTemplate(t('nearestBranchTravelDrive'), {
        minutes: String(formatTravelDurationMinutes(nearest.drive.durationSeconds)),
      })
    );
  }

  return parts.join(' · ');
}

function groupNearestSlots(
  slots: NearestBranchHomeSlot[],
  locale: Locale,
  todayIso: string
): { dayLabel: string; slots: NearestBranchHomeSlot[] }[] {
  const limited = slots.slice(0, MAX_SLOTS);
  const order: string[] = [];
  const byDate = new Map<string, NearestBranchHomeSlot[]>();

  for (const slot of limited) {
    if (!byDate.has(slot.date)) {
      byDate.set(slot.date, []);
      order.push(slot.date);
    }
    byDate.get(slot.date)!.push(slot);
  }

  return order.map((date) => ({
    dayLabel: formatRelativeDayLabel({
      dayIso: date,
      todayIso,
      locale,
      variant: 'title',
    }),
    slots: byDate.get(date) ?? [],
  }));
}

function NearestBranchTravelRow({
  icon,
  label,
  onPress,
  isLast = false,
}: {
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
  nearest: NonNullable<ReturnType<typeof useNearestBranch>['nearest']>,
  locale: Locale,
  t: (key: TranslationKey) => string,
  onOpenNavigate: () => void
) {
  const rows: { key: string; icon: React.ComponentProps<typeof Icon>['name']; label: string }[] = [];

  if (nearest.drive) {
    rows.push({
      key: 'distance',
      icon: 'MapPin',
      label: interpolateTemplate(t('nearestBranchTravelFromYou'), {
        distance: formatTravelDistanceMeters(nearest.drive.distanceMeters, locale),
      }),
    });
    rows.push({
      key: 'drive',
      icon: 'Car',
      label: `${interpolateTemplate(t('nearestBranchTravelDrive'), {
        minutes: String(formatTravelDurationMinutes(nearest.drive.durationSeconds)),
      })}${nearest.drive.trafficAware ? t('nearestBranchTravelTrafficSuffix') : ''}`,
    });
  }
  if (nearest.bicycle) {
    rows.push({
      key: 'bike',
      icon: 'Bike',
      label: interpolateTemplate(t('nearestBranchTravelBicycle'), {
        minutes: String(formatTravelDurationMinutes(nearest.bicycle.durationSeconds)),
      }),
    });
  }
  if (nearest.walk) {
    rows.push({
      key: 'walk',
      icon: 'Footprints',
      label: interpolateTemplate(t('nearestBranchTravelWalk'), {
        minutes: String(formatTravelDurationMinutes(nearest.walk.durationSeconds)),
      }),
    });
  }

  return rows.map((row, index) => (
    <NearestBranchTravelRow
      key={row.key}
      icon={row.icon}
      label={row.label}
      onPress={onOpenNavigate}
      isLast={index === rows.length - 1}
    />
  ));
}

function NearestBranchSheetContent({
  nearest,
  branchMeta,
  crmBranchId,
  slotGroups,
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
  onLeaveNearestFlow,
  actionsSheetRef,
  shareSheetRef,
}: {
  nearest: NonNullable<ReturnType<typeof useNearestBranch>['nearest']>;
  branchMeta: ReturnType<typeof getBranchContactMeta>;
  crmBranchId: string;
  slotGroups: { dayLabel: string; slots: NearestBranchHomeSlot[] }[];
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
  onLeaveNearestFlow: () => void;
  actionsSheetRef: React.RefObject<ActionSheetRef | null>;
  shareSheetRef: React.RefObject<ActionSheetRef | null>;
}) {
  const { copyToClipboard } = useCopyFeedback();

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

            <Pressable
              onPress={() => copyToClipboard(branchMeta.address)}
              className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70">
              <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                {branchMeta.address}
              </ThemedText>
              <Icon
                name="Copy"
                size={12}
                className="shrink-0 text-light-subtext dark:text-dark-subtext"
              />
            </Pressable>

            <View className="mt-2.5">
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
              onLeaveFlow={onLeaveNearestFlow}
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
                  longitude: branchMeta.longitude,
                })
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
                  longitudeDelta: 0.012,
                }}>
                <Marker
                  coordinate={{
                    latitude: branchMeta.latitude,
                    longitude: branchMeta.longitude,
                  }}
                  title={branchMeta.shortLabel}
                />
              </MapView>
            </Pressable>
            {interiorImages.length > 0 ? (
              <View
                className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-black"
                style={{ aspectRatio: 16 / 10 }}>
                <ImageCarousel
                  key={branchMeta.id}
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

          <View>{buildTravelRows(nearest, locale, t, onOpenNavigate)}</View>

          <View>
            <ThemedText className="mb-3 text-base font-semibold leading-6">
              {t('nearestBranchSlotsTitle')}
            </ThemedText>
            {slotGroups.length === 0 ? (
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
                            onLeaveNearestFlow();
                            void startBarberSlotHandoffBooking({
                              employeeId: slot.employeeId,
                              employeeName: slot.employeeName,
                              branchId: slot.branchId,
                              branchName: slot.branchName,
                              branchAddress: slot.branchAddress,
                              date: slot.date,
                              slotStart: slot.time,
                              slotEnd: slot.endTime || undefined,
                            }).catch(() => {});
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

export default function HomeNearestBranch({
  teamCards,
  locale,
  t,
  homeRefreshing = false,
}: HomeNearestBranchProps) {
  const { width: screenWidth } = useWindowDimensions();
  const sheetRef = useRef<ActionSheetRef>(null);
  const navigateRef = useRef<ActionSheetRef>(null);
  const callUsRef = useRef<ActionSheetRef>(null);
  const actionsRef = useRef<ActionSheetRef>(null);
  const shareRef = useRef<ActionSheetRef>(null);
  const wasRefreshingRef = useRef(false);
  const {
    nearest,
    error,
    loading,
    userLocationLabel,
    prefetchNearest,
    resolveNearest,
  } = useNearestBranch();

  useEffect(() => {
    void prefetchNearest();
  }, [prefetchNearest]);

  useEffect(() => {
    if (homeRefreshing) {
      wasRefreshingRef.current = true;
      return;
    }
    if (wasRefreshingRef.current) {
      wasRefreshingRef.current = false;
      void prefetchNearest({ force: true });
    }
  }, [homeRefreshing, prefetchNearest]);

  const slotsByBranch = useMemo(
    () => buildNearestBranchSlotsByInternalId(teamCards, locale),
    [teamCards, locale]
  );

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  const openSheet = useCallback(() => {
    sheetRef.current?.show();
    void resolveNearest();
  }, [resolveNearest]);

  const branchMeta = nearest ? getBranchContactMeta(nearest.id) : null;
  const showLiveTile = Boolean(nearest && !error);
  const showLoadingTile = loading && !nearest;
  const youLine = userLocationLabel
    ? interpolateTemplate(t('nearestBranchHomeYou'), { location: userLocationLabel })
    : t('nearestBranchHomeYouFallback');
  const nearestLine =
    nearest && branchMeta
      ? interpolateTemplate(t('nearestBranchHomeNearestLine'), {
          details: buildNearestHomeDetails(nearest, branchMeta.shortLabel, locale, t),
        })
      : '';
  const crmBranchId = nearest ? resolveCrmBranchId(nearest.id) : '';
  const branchSlots = nearest ? slotsByBranch[nearest.id] : [];
  const slotGroups = useMemo(
    () => groupNearestSlots(branchSlots, locale, todayIso),
    [branchSlots, locale, todayIso]
  );

  const shareUrl = useMemo(() => {
    if (!nearest) return '';
    const prefix = locale === 'cs' ? '' : `/${locale}`;
    return `${SEO_STARTER_WEB_ORIGIN}${prefix}/pobocky/${nearest.id}`;
  }, [nearest, locale]);

  const shareCopy = useMemo(
    () =>
      nearest && shareUrl
        ? buildBranchShareCopy(branchMeta?.shortLabel ?? nearest.name, shareUrl, locale)
        : { title: '', emailSubject: '', emailBody: '' },
    [nearest, shareUrl, branchMeta?.shortLabel, locale]
  );

  const interiorImages = useMemo(
    () => (nearest ? getBranchInteriorCarouselImages(nearest.id) : []),
    [nearest?.id]
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

  const leaveNearestFlow = useCallback(() => {
    sheetRef.current?.hide();
  }, []);

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
    leaveNearestFlow();
    if (!branchBookingHref) return;
    router.push(branchBookingHref as never);
  }, [branchBookingHref, leaveNearestFlow]);

  const openNavigate = () => navigateRef.current?.show();
  const openCallUs = () => callUsRef.current?.show();

  const openBranchDetail = () => {
    if (!crmBranchId) return;
    leaveNearestFlow();
    router.push(`/screens/branch-detail?id=${encodeURIComponent(crmBranchId)}` as never);
  };

  const errorMessage =
    error === 'denied'
      ? t('nearestBranchDenied')
      : error === 'unavailable'
        ? t('nearestBranchUnavailable')
        : error === 'failed'
          ? t('nearestBranchFailed')
          : null;

  return (
    <>
      <Pressable
        onPress={openSheet}
        className="mb-2 w-full rounded-2xl bg-light-secondary dark:bg-dark-secondary active:opacity-70">
        {showLoadingTile ? (
          <View className="gap-2 p-3.5">
            <View className="h-3 w-24 rounded-md bg-light-subtext/15 dark:bg-dark-subtext/15" />
            <View className="h-4 w-56 max-w-full rounded-md bg-light-subtext/15 dark:bg-dark-subtext/15" />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {t('nearestBranchLoading')}
            </ThemedText>
          </View>
        ) : showLiveTile ? (
          <View className="gap-1 p-3.5">
            <ThemedText
              className="text-xs leading-4 text-light-subtext dark:text-dark-subtext"
              numberOfLines={1}>
              {youLine}
            </ThemedText>
            <ThemedText className="text-sm font-semibold leading-5" numberOfLines={2}>
              {nearestLine}
            </ThemedText>
          </View>
        ) : (
          <View className="flex-row items-center gap-3 p-3.5">
            <Image source={TILE_IMAGE} style={{ width: 28, height: 28 }} contentFit="contain" />
            <ThemedText
              className="min-w-0 flex-1 text-sm font-semibold leading-tight"
              numberOfLines={2}>
              {t('nearestBranchFindCta')}
            </ThemedText>
          </View>
        )}
      </Pressable>

      <ActionSheetThemed
        ref={sheetRef}
        gestureEnabled
        snapPoints={[100]}
        withNestedSheetProvider={
          <>
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
          </>
        }>
        {errorMessage ? (
          <View className="px-4 pb-8 pt-2">
            <ThemedText className="py-6 text-left text-sm text-light-subtext dark:text-dark-subtext">
              {errorMessage}
            </ThemedText>
          </View>
        ) : null}

        {!errorMessage && loading && !nearest ? (
          <View className="px-4 pb-8 pt-2">
            <ThemedText className="py-6 text-left text-sm text-light-subtext dark:text-dark-subtext">
              {t('nearestBranchLoading')}
            </ThemedText>
          </View>
        ) : null}

        {!errorMessage && nearest && branchMeta ? (
          <NearestBranchSheetContent
            nearest={nearest}
            branchMeta={branchMeta}
            crmBranchId={crmBranchId}
            slotGroups={slotGroups}
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
            onLeaveNearestFlow={leaveNearestFlow}
            actionsSheetRef={actionsRef}
            shareSheetRef={shareRef}
          />
        ) : null}
      </ActionSheetThemed>
    </>
  );
}
