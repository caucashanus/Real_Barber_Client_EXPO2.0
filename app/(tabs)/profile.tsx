import { useFocusEffect } from "expo-router/react-navigation";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, RefreshControl, Text, Linking } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getClientMe, type ClientMe } from '@/api/client';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import ListLink from '@/components/ListLink';
import { ProfileCompletionSheet } from '@/components/profile/ProfileCompletionSheet';
import ProfileContactsSection from '@/components/profile/ProfileContactsSection';
import SurfaceCard from '@/components/layout/SurfaceCard';
import { ThemeAppearanceSheet } from '@/components/profile/ThemeAppearanceSheet';
import { AccentColorSheet } from '@/components/profile/AccentColorSheet';
import { LanguageSwitcherDrawer } from '@/components/shared/LanguageSwitcherDrawer';
import LocaleFlag from '@/components/shared/LocaleFlag';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import type { ProfileCompletionStepId } from '@/constants/profileCompletionSchema';
import { useTheme } from '@/contexts/ThemeContext';
import { PROFILE_BOOKINGS_ROUTE } from '@/constants/profileContacts';
import { useProfileCompletionPrompt } from '@/hooks/useProfileCompletionPrompt';
import { maybeRequestAppStoreReview } from '@/utils/appStoreReview';
import { hasServerProfileAvatar } from '@/utils/editProfileAvatar';
import { shouldStaleRefresh } from '@/utils/staleRefresh';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

/** Spodní badge s číslem verze (přizpůsobeno iOS/Android buildu). */
function ProfileVersionBadge() {
  const { t } = useTranslation();
  const version = Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—';
  return (
    <View className="mt-8 items-center px-4 pb-8">
      <View className="rounded-full bg-light-secondary px-4 py-2 dark:bg-dark-secondary">
        <ThemedText className="text-center text-xs text-light-subtext dark:text-dark-subtext">
          {t('profileAppVersionLabel')} – {version}
        </ThemedText>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { accentColor } = useAccentColor();
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const refreshFnRef = useRef<(() => Promise<void>) | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFnRef.current?.();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      Notifications.getPermissionsAsync().then(({ status }) => setNotifStatus(status));
    }, [])
  );

  const handleProfileBellPress = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const notifBadge =
    notifStatus === null ? null : (
      <View
        className={`absolute -left-1.5 -top-1 z-30 h-5 w-5 items-center justify-center rounded-full border border-white dark:border-dark-primary ${notifStatus === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', lineHeight: 12 }}>
          {notifStatus === 'granted' ? '✓' : '✕'}
        </Text>
      </View>
    );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        rightComponents={[
          <HeaderIcon
            key="notifications"
            icon="Bell"
            badge={notifBadge}
            onPress={handleProfileBellPress}
          />,
        ]}
      />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ThemedScroller
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
          }>
          <PersonalProfile
            onRegisterRefresh={(fn) => {
              refreshFnRef.current = fn;
            }}
          />
        </ThemedScroller>
      </View>
    </View>
  );
}

function daysSinceCreatedAt(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (24 * 60 * 60 * 1000)));
}

const PersonalProfile = ({
  onRegisterRefresh}: {
  onRegisterRefresh?: (fn: () => Promise<void>) => void;
}) => {
  const { apiToken, signOutToLogin } = useAuth();
  const { bookings } = useBookings();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { accentColor } = useAccentColor();
  const languageSheetRef = useRef<ActionSheetRef>(null);
  const appearanceSheetRef = useRef<ActionSheetRef>(null);
  const accentSheetRef = useRef<ActionSheetRef>(null);
  const completionSheetRef = useRef<ActionSheetRef>(null);
  const [completionStep, setCompletionStep] = useState<ProfileCompletionStepId | null>(null);
  const [client, setClient] = useState<ClientMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProfileFetchRef = useRef(0);
  const profileInflightRef = useRef<Promise<void> | null>(null);
  const didProfileReviewAttemptRef = useRef(false);

  const reservationsCount = bookings.length;

  useFocusEffect(
    useCallback(() => {
      if (didProfileReviewAttemptRef.current) return;
      if (reservationsCount < 1) return;
      didProfileReviewAttemptRef.current = true;
      void maybeRequestAppStoreReview({ trigger: 'profile', delayMs: 1200 });
    }, [reservationsCount])
  );

  const fetchData = useCallback(async (options?: { force?: boolean }) => {
    if (!apiToken) {
      setClient(null);
      lastProfileFetchRef.current = 0;
      return;
    }
    if (!shouldStaleRefresh(lastProfileFetchRef.current, options)) return;
    if (profileInflightRef.current) return profileInflightRef.current;

    const isInitial = lastProfileFetchRef.current === 0;
    if (isInitial || options?.force) setLoading(true);

    profileInflightRef.current = getClientMe(apiToken)
      .then((me) => {
        setClient(me);
        setError(null);
        lastProfileFetchRef.current = Date.now();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => {
        setLoading(false);
        profileInflightRef.current = null;
      });

    return profileInflightRef.current;
  }, [apiToken]);

  useEffect(() => {
    void fetchData({ force: true });
  }, [fetchData]);

  useEffect(() => {
    if (onRegisterRefresh) onRegisterRefresh(() => fetchData({ force: true }));
  }, [fetchData, onRegisterRefresh]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData])
  );

  const handleCompletionStepChange = useCallback((step: ProfileCompletionStepId | null) => {
    setCompletionStep(step);
  }, []);

  const handleCompletionClose = useCallback(() => {
    setCompletionStep(null);
  }, []);

  useProfileCompletionPrompt({
    client,
    loading,
    sheetRef: completionSheetRef,
    onStepChange: handleCompletionStepChange});

  const displayName = client?.firstName?.trim() || client?.name?.trim() || null;
  const profileAvatarSrc = hasServerProfileAvatar(client?.avatarUrl)
    ? client!.avatarUrl!
    : undefined;
  const addressLine =
    [client?.address?.trim(), client?.city?.trim()].filter(Boolean).join(', ') || null;
  const daysMember = daysSinceCreatedAt(client?.createdAt);
  const memberDaysDisplay =
    daysMember === null
      ? '—'
      : daysMember === 0
        ? t('profileMemberDaysFirstDay')
        : String(daysMember);

  return (
    <AnimatedView className="pt-4" animation="scaleIn">
      <SurfaceCard className="mb-4 flex-row items-center justify-center p-10">
        <View className="w-1/2 flex-col items-center">
          {loading ? (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary">
              <SiteLoadingSpinner />
            </View>
          ) : (
            <Avatar
              src={profileAvatarSrc}
              fallbackIcon="CircleUser"
              size="xxl"
            />
          )}
          <View className="flex-1 items-center justify-center">
            <ThemedText className="text-2xl font-bold">
              {displayName ?? t('profileGuest')}
            </ThemedText>
            {error && (
              <ThemedText className="mt-1 text-xs text-red-500 dark:text-red-400">
                {error}
              </ThemedText>
            )}
            <View className="flex flex-row items-center">
              <ThemedText className="ml-2 text-sm text-light-subtext dark:text-dark-subtext">
                {addressLine ?? '—'}
              </ThemedText>
            </View>
          </View>
        </View>
        <View className="w-1/2 flex-col items-start justify-center pl-12">
          <View className="w-full">
            <ThemedText className="text-xl font-bold">{reservationsCount}</ThemedText>
            <ThemedText className="text-xs">{t('profileReservations')}</ThemedText>
          </View>
          <View className="mt-3 w-full border-t border-neutral-300 pt-3 dark:border-dark-primary">
            <ThemedText className="text-xl font-bold">{memberDaysDisplay}</ThemedText>
            <ThemedText className="text-xs">{t('profileMemberDays')}</ThemedText>
          </View>
        </View>
      </SurfaceCard>

      <View className="gap-1 px-4">
        <ListLink
          showChevron
          title={t('profileMyReservations')}
          icon="Calendar"
          href={PROFILE_BOOKINGS_ROUTE}
        />
        <ListLink
          showChevron
          title={t('profileFeatureSettings')}
          icon="SlidersHorizontal"
          href="/screens/feature-settings"
        />
        <ListLink
          showChevron
          title={t('profileAccountSettings')}
          icon="Settings"
          href="/screens/settings"
        />
        <ListLink
          showChevron
          title={t('profileAppLanguage')}
          leading={<LocaleFlag locale={locale} />}
          accessibilityLabel={t('localeSwitch')}
          onPress={() => languageSheetRef.current?.show()}
        />
        <ListLink
          showChevron
          title={t('profileEditProfile')}
          icon="UserRoundPen"
          href="/screens/edit-profile"
        />
        <ListLink
          showChevron
          title={isDark ? t('profileAppearanceLightMode') : t('profileAppearanceDarkMode')}
          icon={isDark ? 'Sun' : 'Moon'}
          onPress={() => appearanceSheetRef.current?.show()}
        />
        <ListLink
          showChevron
          title={t('settingsAccent')}
          leading={
            <View className="relative">
              <Icon name="Palette" size={24} strokeWidth={1.3} />
              <View
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-light-primary dark:border-dark-primary"
                style={{ backgroundColor: accentColor }}
              />
            </View>
          }
          onPress={() => accentSheetRef.current?.show()}
        />
        <ListLink
          showChevron
          title={t('profileLogout')}
          icon="LogOut"
          onPress={() => {
            signOutToLogin().catch(() => {});
          }}
        />
      </View>
      <LanguageSwitcherDrawer ref={languageSheetRef} />
      <ThemeAppearanceSheet ref={appearanceSheetRef} />
      <AccentColorSheet ref={accentSheetRef} />
      <ProfileCompletionSheet
        ref={completionSheetRef}
        step={completionStep}
        onClose={handleCompletionClose}
      />
      <ProfileContactsSection />
      <ProfileVersionBadge />
    </AnimatedView>
  );
};
