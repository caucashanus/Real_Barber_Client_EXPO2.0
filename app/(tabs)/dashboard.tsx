import React from 'react';
import { View, Image, Pressable } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { renderNotification } from '@/app/screens/notifications';
import AnimatedView from '@/components/AnimatedView';
import { CardScroller } from '@/components/CardScroller';
import { Chip } from '@/components/Chip';
import Header, { HeaderIcon } from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';

// Order interfaces
interface MarketplaceOrder {
  id: number;
  serviceName: string;
  customerName: string;
  customerAvatar: any;
  date: string;
  status: 'pending' | 'completed' | 'canceled';
  totalPaid: string;
}

// Notification interfaces
interface User {
  id: number;
  name: string;
  avatar: string;
}

interface Notification {
  id: number;
  type:
    | 'purchase'
    | 'message'
    | 'review'
    | 'offer'
    | 'seller'
    | 'all'
    | 'booking'
    | 'payment'
    | 'inquiry'
    | 'cancellation';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: IconName;
  user?: User;
}

const DashboardScreen = () => {
  const { t } = useTranslation();
  const rightComponents = [
    <HeaderIcon key="notifications-icon" hasBadge icon="Bell" href="/screens/notifications" />,
  ];

  // Recent notifications
  const recentNotifications: Notification[] = [
    {
      id: 1,
      type: 'booking',
      title: 'New Booking Confirmed',
      message: '',
      time: '5 min ago',
      read: false,
      icon: 'Calendar',
    },
    {
      id: 2,
      type: 'message',
      title: 'Guest Message',
      message: 'John asked about early check-in for tomorrow',
      time: '1 hour ago',
      read: true,
      icon: 'MessageCircle',
      user: {
        id: 101,
        name: 'John Smith',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    },
    {
      id: 3,
      type: 'review',
      title: 'New 5-Star Review',
      message: 'Sarah left a glowing review for your Downtown Loft',
      time: '3 hours ago',
      read: false,
      icon: 'Star',
      user: {
        id: 102,
        name: 'Sarah Miller',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Received',
      message: "You received $450 for Alex's stay at Mountain Cabin",
      time: '6 hours ago',
      read: true,
      icon: 'DollarSign',
    },
    {
      id: 5,
      type: 'inquiry',
      title: 'Booking Inquiry',
      message: 'Emma is interested in your City Apartment for next weekend',
      time: '1 day ago',
      read: false,
      icon: 'HelpCircle',
      user: {
        id: 103,
        name: 'Emma Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      },
    },
    {
      id: 6,
      type: 'cancellation',
      title: 'Booking Cancelled',
      message: 'Guest cancelled reservation for Ocean View Suite - full refund issued',
      time: '2 days ago',
      read: true,
      icon: 'X',
    },
  ];

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header rightComponents={rightComponents} />

      <ThemeScroller scrollEventThrottle={16} className="px-global">
        <AnimatedView animation="scaleIn" className="flex-1">
          <ThemedText className="pb-16 pr-20 pt-10 text-4xl font-semibold">
            Welcome back, John Doe
          </ThemedText>

          <Section titleSize="xl" className="mb-2" title={t('dashboardRecentReservations')}>
            <CardScroller className="mt-1">
              <Chip label={`${t('dashboardArrivingSoon')} (1)`} size="lg" />
              <Chip label={`${t('dashboardUpcoming')} (23)`} size="lg" />
            </CardScroller>

            <ReservationCard />
          </Section>

          <Section
            titleSize="xl"
            className="mb-2 mt-10"
            title={t('dashboardRecentNotifications')}
          />
          <View className="overflow-hidden">
            {recentNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                {renderNotification(notification)}
              </React.Fragment>
            ))}
          </View>
        </AnimatedView>
      </ThemeScroller>
    </View>
  );
};

const ReservationCard = () => {
  return (
    <View
      style={shadowPresets.large}
      className="mt-4 rounded-xl border border-neutral-300 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary">
      <View className="p-4">
        <ThemedText className="mb-16 text-base font-semibold">Arriving tomorrow</ThemedText>
        <View className="flex-row items-center justify-between">
          <View>
            <ThemedText className="text-xl font-semibold">John Doe</ThemedText>
            <ThemedText className="font-regular text-base">Jun 23 - 28</ThemedText>
          </View>
          <Image
            source={require('@/assets/img/wallet/RB.avatar.jpg')}
            className="h-12 w-12 rounded-full"
          />
        </View>
      </View>
      <View className="w-full flex-row border-t border-neutral-300 dark:border-neutral-700">
        <Pressable className="w-1/2 items-center border-r border-neutral-300 py-5 dark:border-neutral-700">
          <ThemedText className="font-semibold">Message</ThemedText>
        </Pressable>
        <Pressable className="w-1/2 items-center py-5">
          <ThemedText className="font-semibold">Call</ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

export default DashboardScreen;
