import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ImageBackground,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';

import { getBookings } from '@/api/bookings';
import { getClientMe, type ClientMe } from '@/api/client';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBusinessMode } from '@/app/contexts/BusinesModeContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import ThemeToggle from '@/components/ThemeToggle';
import Divider from '@/components/layout/Divider';
import { shadowPresets } from '@/utils/useShadow';

/** Profil → Doporučení (`/screens/referrals`). */
const SHOW_PROFILE_REFERRALS_SECTION = false;

/** Profil → Nápověda (`/screens/help`). Nastav na `true`, až bude sekce znovu potřeba. */
const SHOW_PROFILE_HELP_SECTION = false;

export default function ProfileScreen() {
  const { isBusinessMode } = useBusinessMode();
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        leftComponent={<ThemeToggle />}
        rightComponents={[
          <HeaderIcon key="notifications" icon="Bell" href="/screens/notifications" />,
        ]}
      />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ThemedScroller>{isBusinessMode ? <HostProfile /> : <PersonalProfile />}</ThemedScroller>
      </View>
    </View>
  );
}

const HostProfile = () => {
  const { t } = useTranslation();
  return (
    <>
      <AnimatedView className="" animation="scaleIn">
        <View className="mb-8 mt-6 items-center rounded-3xl bg-slate-200 p-10 dark:bg-dark-secondary">
          <View className="relative h-20 w-20">
            <View className="relative z-20 h-full w-full overflow-hidden rounded-xl border-2 border-light-primary dark:border-dark-primary">
              <Image
                className="h-full w-full"
                source={{
                  uri: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?q=80&w=400',
                }}
              />
            </View>
            <View className="absolute left-8 top-0 h-full w-full rotate-12 overflow-hidden rounded-xl border-2 border-light-primary dark:border-dark-primary">
              <Image
                className="h-full w-full"
                source={{
                  uri: 'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200',
                }}
              />
            </View>
            <View className="absolute right-8 top-0 h-full w-full -rotate-12 overflow-hidden rounded-xl border-2 border-light-primary dark:border-dark-primary">
              <Image
                className="h-full w-full"
                source={{
                  uri: 'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200',
                }}
              />
            </View>
          </View>
          <ThemedText className="mt-4 text-2xl font-semibold">
            {t('profileNewToHosting')}
          </ThemedText>
          <ThemedText className="px-4 text-center text-sm font-light ">
            {t('profileNewToHostingDesc')}
          </ThemedText>
          <Button title={t('profileGetStarted')} className="mt-4" textClassName="text-white" />
        </View>
        <View className="px-4">
          <ListLink
            showChevron
            title={t('profileReservations')}
            icon="Briefcase"
            href="/screens/reservations"
          />
          <ListLink
            showChevron
            title={t('profileEarnings')}
            icon="Banknote"
            href="/screens/earnings"
          />
          <ListLink
            showChevron
            title={t('profileInsights')}
            icon="BarChart"
            href="/screens/insights"
          />
          <ListLink
            showChevron
            title={t('profileCreateListing')}
            icon="PlusCircle"
            href="/screens/add-property-start"
          />
        </View>
      </AnimatedView>
    </>
  );
};

function daysSinceCreatedAt(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (24 * 60 * 60 * 1000)));
}

const PersonalProfile = () => {
  const { apiToken, clearAuth } = useAuth();
  const { t } = useTranslation();
  const [client, setClient] = useState<ClientMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationsCount, setReservationsCount] = useState<number>(0);

  useEffect(() => {
    if (!apiToken) {
      setClient(null);
      setReservationsCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    getClientMe(apiToken)
      .then(setClient)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));

    getBookings(apiToken, { limit: 1 })
      .then((res) => setReservationsCount(res.pagination?.total ?? res.bookings?.length ?? 0))
      .catch(() => setReservationsCount(0));
  }, [apiToken]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      getClientMe(apiToken)
        .then(setClient)
        .catch(() => {});
    }, [apiToken])
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
        {SHOW_PROFILE_HELP_SECTION ? (
          <ListLink
            showChevron
            title={t('profileGetHelp')}
            icon="HelpCircle"
            href="/screens/help"
          />
        ) : null}
        {SHOW_PROFILE_REFERRALS_SECTION ? (
          <ListLink
            showChevron
            title={t('profileReferrals')}
            icon="Gift"
            href="/screens/referrals"
          />
        ) : null}
        <ListLink
          showChevron
          title="Poslat apku kamarádovi"
          icon="Share2"
          onPress={() =>
            void Share.share({
              message: 'https://apps.apple.com/ca/app/rb/id6760221388',
            })
          }
        />
        <Divider />
        <ListLink
          showChevron
          title={t('profileLogout')}
          icon="LogOut"
          onPress={async () => {
            await clearAuth();
            router.replace('/screens/welcome');
          }}
        />
      </View>
    </AnimatedView>
  );
};
