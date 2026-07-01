import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, RefreshControl, Text, ActivityIndicator, Share } from 'react-native';

import { getClientMe, type ClientMe } from '@/api/client';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookings } from '@/app/contexts/BookingsBadgeContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useUnreadNotificationBadge } from '@/app/hooks/useUnreadNotificationBadge';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import Header, { HeaderIcon } from '@/components/Header';
import ListLink from '@/components/ListLink';
import NotificationPromptSheet, {
  type NotificationPromptSheetHandle,
} from '@/components/NotificationPromptSheet';
import ThemedScroller from '@/components/ThemeScroller';
import ThemeToggle from '@/components/ThemeToggle';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import { maybeRequestAppStoreReview } from '@/utils/appStoreReview';
import { shouldStaleRefresh } from '@/utils/staleRefresh';
import { shadowPresets } from '@/utils/useShadow';

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
  const notifPromptRef = useRef<NotificationPromptSheetHandle>(null);

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
    router.push('/screens/notifications');
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
      <NotificationPromptSheet ref={notifPromptRef} enableAutoCheck={false} />
      <Header
        leftComponent={<ThemeToggle />}
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
  onRegisterRefresh,
}: {
  onRegisterRefresh?: (fn: () => Promise<void>) => void;
}) => {
  const { apiToken, signOutToLogin } = useAuth();
  const { bookings } = useBookings();
  const { t } = useTranslation();
  const hasUnreadNotifications = useUnreadNotificationBadge();
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

  const displayName = client?.firstName?.trim() || client?.name?.trim() || null;
  const avatarSrc = client?.avatarUrl ?? require('@/assets/img/wallet/RB.avatar.jpg');
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
      <View
        style={{ ...shadowPresets.large }}
        className="mb-4  flex-row items-center justify-center rounded-3xl bg-light-primary p-10 dark:bg-dark-secondary">
        <View className="w-1/2 flex-col items-center">
          {loading ? (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-primary">
              <ActivityIndicator />
            </View>
          ) : (
            <Avatar src={avatarSrc} size="xxl" />
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
      </View>

      <View className="gap-1 px-4">
        <ListLink
          showChevron
          title={t('profileAccountSettings')}
          icon="Settings"
          href="/screens/settings"
        />
        <ListLink
          showChevron
          title={t('profileEditProfile')}
          icon="UserRoundPen"
          href="/screens/edit-profile"
        />
        <ListLink
          showChevron
          hasBadge={hasUnreadNotifications}
          title={t('profileNotificationHistory')}
          icon="Bell"
          href="/screens/notifications"
        />
        <ListLink
          showChevron
          title="Poslat apku kamarádovi"
          icon="Share2"
          onPress={() =>
            Share.share({
              message: 'https://apps.apple.com/ca/app/rb/id6760221388',
            })
          }
        />
        <Divider />
        <ListLink
          showChevron
          title={t('profileLogout')}
          icon="LogOut"
          onPress={() => {
            signOutToLogin().catch(() => {});
          }}
        />
      </View>
      <ProfileVersionBadge />
    </AnimatedView>
  );
};
