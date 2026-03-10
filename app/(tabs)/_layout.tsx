import { useThemeColors } from 'app/contexts/ThemeColors';
import { TabButton } from 'components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import React from 'react';
import { useBusinessMode } from '@/app/contexts/BusinesModeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookingsBadge } from '@/app/contexts/BookingsBadgeContext';
import { BookingsBadgeProvider } from '@/app/contexts/BookingsBadgeContext';
import { useTranslation } from '@/app/hooks/useTranslation';

function TabsContent() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { isBusinessMode } = useBusinessMode();
  const insets = useSafeAreaInsets();
  const { hasUpcomingBookings } = useBookingsBadge();

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          //height: 80,
          backgroundColor: colors.bg,
          borderTopColor: colors.secondary,
          borderTopWidth: 1,
          // paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/****Host tabs */}
        <TabTrigger name="dashboard" href="/(tabs)/dashboard" asChild>
          <TabButton labelAnimated={false} icon="Home" hidden={!isBusinessMode}>{t('navHome')}</TabButton>
        </TabTrigger>
        <TabTrigger name="calendar" href="/(tabs)/calendar" asChild>
          <TabButton labelAnimated={false} icon="CalendarFold" hidden={!isBusinessMode}>{t('navCalendar')}</TabButton>
        </TabTrigger>
        <TabTrigger name="analytics" href="/(tabs)/listings" asChild>
          <TabButton labelAnimated={false} icon="File" hidden={!isBusinessMode}>{t('navListings')}</TabButton>
        </TabTrigger>

        {/* Consumer mode tabs */}
        <TabTrigger name="(home)" href="/(tabs)/(home)" asChild>
          <TabButton labelAnimated={false} icon="Search" hidden={isBusinessMode}>{t('navHome')}</TabButton>
        </TabTrigger>
        <TabTrigger name="favorites" href="/favorites" asChild>
          <TabButton labelAnimated={false} icon="Heart" hidden={isBusinessMode}>{t('navFavorites')}</TabButton>
        </TabTrigger>
        <TabTrigger name="trips" href="/trips" asChild>
          <TabButton labelAnimated={false} hasBadge={hasUpcomingBookings} icon="CalendarPlus" hidden={isBusinessMode}>{t('navBookings')}</TabButton>
        </TabTrigger>
        <TabTrigger name="chat" href="/(tabs)/chat" asChild>
          <TabButton labelAnimated={false} hasBadge icon="MessageSquare">{t('navMessages')}</TabButton>
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton labelAnimated={false} icon="CircleUser">{t('navProfile')}</TabButton>
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
