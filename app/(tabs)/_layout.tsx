import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from 'app/contexts/ThemeColors';
import { TabButton } from 'components/TabButton';
import { router, usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/AuthContext';
import { BookingsBadgeProvider, useBookingsBadge } from '@/app/contexts/BookingsBadgeContext';
import { useTranslation } from '@/app/hooks/useTranslation';

function TabsContent() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasUpcomingBookings } = useBookingsBadge();
  const { apiToken } = useAuth();
  const pathname = usePathname();

  const appStateRef = useRef(AppState.currentState);
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!apiToken) return;

    const KEY = '@rb_last_background_at';
    const RESET_MS = 60 * 60 * 1000;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && nextState !== 'active') {
        AsyncStorage.setItem(KEY, String(Date.now())).catch(() => {});
        return;
      }

      if (prev !== 'active' && nextState === 'active') {
        if (!didHydrateRef.current) {
          didHydrateRef.current = true;
          return;
        }

        AsyncStorage.getItem(KEY)
          .then((raw) => {
            const last = raw ? Number(raw) : NaN;
            if (!Number.isFinite(last)) return;
            if (Date.now() - last < RESET_MS) return;
            if (pathname === '/real-barber') return;
            router.replace('/real-barber');
          })
          .catch(() => {});
      }
    });

    return () => sub.remove();
  }, [apiToken, pathname]);

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor={colors.highlight}>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" />
          <NativeTabs.Trigger.Label>{t('navHome')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="favorites">
          <NativeTabs.Trigger.Icon sf="heart" />
          <NativeTabs.Trigger.Label>{t('navFavorites')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bookings">
          <NativeTabs.Trigger.Icon sf="calendar" />
          <NativeTabs.Trigger.Label>{t('navBookings')}</NativeTabs.Trigger.Label>
          {hasUpcomingBookings ? <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge> : null}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.circle" />
          <NativeTabs.Trigger.Label>{t('navProfile')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          backgroundColor: colors.bg,
          borderTopColor: colors.secondary,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
        }}>
        <TabTrigger name="(home)" href="/(tabs)/(home)" asChild>
          <TabButton labelAnimated={false} icon="Search">
            {t('navHome')}
          </TabButton>
        </TabTrigger>
        <TabTrigger name="favorites" href="/favorites" asChild>
          <TabButton labelAnimated={false} icon="Heart">
            {t('navFavorites')}
          </TabButton>
        </TabTrigger>
        <TabTrigger name="bookings" href="/bookings" asChild>
          <TabButton labelAnimated={false} hasBadge={hasUpcomingBookings} icon="CalendarPlus">
            {t('navBookings')}
          </TabButton>
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton labelAnimated={false} icon="CircleUser">
            {t('navProfile')}
          </TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

export default function Layout() {
  return (
    <BookingsBadgeProvider>
      <TabsContent />
    </BookingsBadgeProvider>
  );
}
