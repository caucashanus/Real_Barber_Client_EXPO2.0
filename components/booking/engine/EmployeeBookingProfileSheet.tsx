import { router } from 'expo-router';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState} from 'react';
import {
  Dimensions,
  ScrollView,
  View,
  type LayoutChangeEvent} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getTeamMemberPage,
  type TeamMemberPageEmployee} from '@/api/publicTeamMember';
import type { Locale } from '@/contexts/LanguageContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/Avatar';
import BarberAboutSection from '@/components/barber/BarberAboutSection';
import BarberReviewsSection from '@/components/barber/BarberReviewsSection';
import BarberWorkSamplesSection from '@/components/barber/BarberWorkSamplesSection';
import ChoiceChipLabel from '@/components/ChoiceChipLabel';
import RatingBadge from '@/components/RatingBadge';
import ThemedText from '@/components/ThemedText';
import type { BookingEntity } from '@/lib/booking/constants';
import type { TranslationKey } from '@/locales';
import { barberDetailHref } from '@/constants/profileDetailRoutes';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';
import {
  getPragueTodayDateString,
  getTeamMemberBio,
  getTeamMemberDisplayName,
  pickTeamMemberLocalizedField} from '@/utils/teamMemberPageHelpers';

const BOOKING_PROFILE_REVIEWS_LIMIT = 5;
const SHEET_SCROLL_MAX_HEIGHT = Dimensions.get('window').height * 0.62;

export interface EmployeeBookingProfileTarget {
  employee: BookingEntity;
  serviceId?: string;
}

export type EmployeeBookingProfileSheetHandle = {
  open: (target: EmployeeBookingProfileTarget) => void;
};

interface EmployeeBookingProfileSheetProps {
  locale: Locale;
  selectLabel: string;
  onSelect: (employee: BookingEntity) => void;
  t: (key: TranslationKey) => string;
}

function ProfileChipSection({ title, labels }: { title: string; labels: string[] }) {
  if (labels.length === 0) return null;

  return (
    <View className="mt-4">
      <ThemedText className="mb-2 text-base font-semibold">{title}</ThemedText>
      <View className="flex-row flex-wrap">
        {labels.map((label, index) => (
          <View key={`${label}-${index}`} className="mb-2 mr-2">
            <ChoiceChipLabel label={label} />
          </View>
        ))}
      </View>
    </View>
  );
}

const EmployeeBookingProfileSheet = forwardRef<
  EmployeeBookingProfileSheetHandle,
  EmployeeBookingProfileSheetProps
>(({ locale, selectLabel, onSelect, t }, ref) => {
  const sheetRef = useRef<ActionSheetRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const reviewsOffsetRef = useRef(0);
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 24);
  const [target, setTarget] = useState<EmployeeBookingProfileTarget | null>(null);
  const [employee, setEmployee] = useState<TeamMemberPageEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (nextTarget: EmployeeBookingProfileTarget) => {
      const idOrSlug = nextTarget.employee.slug ?? nextTarget.employee.id;
      if (!idOrSlug) {
        setError(t('reservationFromBarberLoadError'));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getTeamMemberPage(idOrSlug, {
          date: getPragueTodayDateString(),
          serviceId: nextTarget.serviceId,
          reviewsLimit: BOOKING_PROFILE_REVIEWS_LIMIT});
        setEmployee(data.employee ?? null);
        if (!data.employee) setError(t('reservationFromBarberLoadError'));
      } catch {
        setEmployee(null);
        setError(t('reservationFromBarberLoadError'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useImperativeHandle(ref, () => ({
    open(nextTarget) {
      setTarget(nextTarget);
      setEmployee(null);
      setError(null);
      void loadProfile(nextTarget);
      setTimeout(() => sheetRef.current?.show(), 50);
    }}));

  const handleSelect = () => {
    if (!target) return;
    sheetRef.current?.hide();
    onSelect(target.employee);
  };

  const handleFullProfile = () => {
    const idOrSlug =
      target?.employee.slug ?? employee?.id ?? target?.employee.id;
    if (!idOrSlug) return;
    sheetRef.current?.hide();
    router.push(barberDetailHref(String(idOrSlug)) as never);
  };

  const scrollToReviews = () => {
    if (reviewsOffsetRef.current <= 0) return;
    scrollRef.current?.scrollTo({ y: reviewsOffsetRef.current, animated: true });
  };

  const displayName = employee
    ? getTeamMemberDisplayName(employee, locale)
    : (target?.employee.displayName ?? target?.employee.name ?? '');
  const bio = employee ? getTeamMemberBio(employee, locale) : null;
  const average = employee?.stats?.averageRating;
  const reviewCount = employee?.stats?.totalReviews;
  const reviews = (employee?.reviews ?? []).slice(0, BOOKING_PROFILE_REVIEWS_LIMIT);
  const languageLabels = (employee?.languages ?? []).filter(Boolean);
  const skillLabels = [
    ...Object.keys(employee?.hairstyleSkills ?? {}),
    ...Object.keys(employee?.coloringSkills ?? {}),
  ]
    .map((label) => label.trim())
    .filter(Boolean);
  const favoriteLabels = (employee?.favoriteServices ?? [])
    .map((service) => pickTeamMemberLocalizedField(service, 'name', locale) ?? service.name)
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name));
  const mediaItems = employee?.media ?? [];

  return (
    <ActionSheetThemed
      ref={sheetRef}
      gestureEnabled
      onClose={() => {
        setError(null);
        setEmployee(null);
      }}>
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: SHEET_SCROLL_MAX_HEIGHT }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4">
          {loading ? (
            <View className="items-center py-10">
              <SiteLoadingSpinner size="compact" />
            </View>
          ) : null}

          {error ? (
            <ThemedText className="py-6 text-center text-sm text-red-500 dark:text-red-400">
              {error}
            </ThemedText>
          ) : null}

          {!loading && employee ? (
            <>
              <View className="items-center">
                <Avatar size="xl" src={employee.avatarUrl ?? undefined} name={displayName} />
              </View>

              <View className="mt-4 flex-row flex-wrap items-center justify-center">
                <ThemedText className="mr-2 text-lg font-semibold" numberOfLines={2}>
                  {displayName}
                </ThemedText>
                {average != null ? (
                  <RatingBadge
                    rating={average}
                    reviewCount={reviewCount}
                    locale={locale}
                    compact={false}
                    onPress={reviews.length > 0 ? scrollToReviews : undefined}
                  />
                ) : null}
              </View>

              {bio ? (
                <View className="mt-4">
                  <BarberAboutSection description={bio} embedded t={t} />
                </View>
              ) : null}

              <ProfileChipSection title={t('bookingEmployeeLanguages')} labels={languageLabels} />
              <ProfileChipSection title={t('barberSkills')} labels={skillLabels} />
              <ProfileChipSection title={t('barberMyFavorites')} labels={favoriteLabels} />

              {mediaItems.length > 0 ? (
                <View className="mt-4">
                  <BarberWorkSamplesSection
                    media={mediaItems}
                    onMediaPress={() => {}}
                    embedded
                    t={t}
                  />
                </View>
              ) : null}

              <BarberReviewsSection
                reviews={reviews}
                hasReviewed
                ownReviewIds={new Set()}
                reviewParams=""
                displayTotal={reviewCount ?? reviews.length}
                locale={locale}
                showPagination={false}
                reviewsLoading={false}
                reviewsError={null}
                canGoPrevious={false}
                canGoNext={false}
                onPrevious={() => {}}
                onNext={() => {}}
                embedded
                onLayout={(event: LayoutChangeEvent) => {
                  reviewsOffsetRef.current = event.nativeEvent.layout.y;
                }}
                t={t}
              />

              <AppButton
                title={t('bookingEmployeeFullProfile')}
                variant="ghost"
                size="sm"
                className="mt-4 self-start px-0"
                textClassName="font-semibold text-black dark:text-white"
                onPress={handleFullProfile}
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      {target ? (
        <View className="px-4 pt-4" style={{ paddingBottom: footerBottomPadding }}>
          <AppButton
            title={selectLabel}
            variant="default"
            fullWidth
            onPress={handleSelect}
            disabled={loading || Boolean(error)}
          />
        </View>
      ) : null}
    </ActionSheetThemed>
  );
});

EmployeeBookingProfileSheet.displayName = 'EmployeeBookingProfileSheet';

export default EmployeeBookingProfileSheet;
