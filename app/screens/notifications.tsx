import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';

import { getNotificationHistory, type NotificationHistoryItem } from '@/api/notifications';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import SkeletonLoader from '@/components/SkeletonLoader';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import List from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';

type NotificationType =
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

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: IconName;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const [selectedType, setSelectedType] = useState<NotificationType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationsData, setNotificationsData] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!apiToken) {
        setNotificationsData([]);
        setLoadError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const { notifications } = await getNotificationHistory(apiToken, {
          limit: 50,
          offset: 0,
        });
        if (!cancelled) {
          setNotificationsData(
            notifications
              .filter((item) => (item.channel ?? '').trim().toUpperCase() === 'PUSH')
              .map(mapHistoryItemToNotification)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsData([]);
          setLoadError(error instanceof Error ? error.message : t('commonError'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [apiToken, t]);

  const filteredNotifications = useMemo(
    () =>
      notificationsData.filter((notification) =>
        selectedType === 'all' ? true : notification.type === selectedType
      ),
    [notificationsData, selectedType]
  );

  return (
    <>
      <Header showBackButton title={t('notificationsTitle')} />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="flex-row gap-1 p-4">
          <Chip
            label={t('notificationsAll')}
            isSelected={selectedType === 'all'}
            onPress={() => setSelectedType('all')}
          />
          <Chip
            label={t('notificationsBookings')}
            isSelected={selectedType === 'booking'}
            onPress={() => setSelectedType('booking')}
          />
          <Chip
            label={t('notificationsPayments')}
            isSelected={selectedType === 'payment'}
            onPress={() => setSelectedType('payment')}
          />
          <Chip
            label={t('notificationsInquiries')}
            isSelected={selectedType === 'inquiry'}
            onPress={() => setSelectedType('inquiry')}
          />
        </View>

        <ThemedScroller>
          {isLoading ? (
            <View className="p-4">
              <SkeletonLoader variant="list" count={6} />
            </View>
          ) : loadError ? (
            <View className="items-center p-8">
              <ThemedText className="text-red-500 dark:text-red-400">{loadError}</ThemedText>
            </View>
          ) : (
            <List variant="divided">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <View key={notification.id}>{renderNotification(notification)}</View>
                ))
              ) : (
                <View className="items-center p-8">
                  <ThemedText>{t('notificationsNoFound')}</ThemedText>
                </View>
              )}
            </List>
          )}
        </ThemedScroller>
      </View>
    </>
  );
}

function normalizeForMatch(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRelativeTime(iso: string): string {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return '';
  const diff = Date.now() - created;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'now';
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min`;
  if (diff < day) return `${Math.floor(diff / hour)} h`;
  return `${Math.floor(diff / day)} d`;
}

function mapHistoryTypeToUiType(item: NotificationHistoryItem): NotificationType {
  const joined = [
    normalizeForMatch(item.type),
    normalizeForMatch(item.category),
    normalizeForMatch(item.entityType),
    normalizeForMatch(item.title),
    normalizeForMatch(item.message),
  ].join(' ');

  if (joined.includes('cancel')) return 'cancellation';
  if (joined.includes('reservation') || joined.includes('booking') || joined.includes('rezervac'))
    return 'booking';
  if (joined.includes('payment') || joined.includes('platb')) return 'payment';
  if (joined.includes('review') || joined.includes('recenz')) return 'review';
  if (joined.includes('inquiry') || joined.includes('dotaz') || joined.includes('question'))
    return 'inquiry';
  if (joined.includes('message') || joined.includes('zpr')) return 'message';
  return 'all';
}

function iconForType(type: NotificationType): IconName {
  switch (type) {
    case 'booking':
      return 'Calendar';
    case 'payment':
      return 'CreditCard';
    case 'review':
      return 'Star';
    case 'inquiry':
      return 'HelpCircle';
    case 'message':
      return 'MessageCircle';
    case 'cancellation':
      return 'X';
    default:
      return 'Bell';
  }
}

function mapHistoryItemToNotification(item: NotificationHistoryItem): Notification {
  const type = mapHistoryTypeToUiType(item);
  const title = item.title?.trim() || 'Notification';
  const message = stripHtml(item.message) || '';
  return {
    id: item.notificationId,
    type,
    title,
    message,
    time: toRelativeTime(item.createdAt),
    read: Boolean(item.read),
    icon: iconForType(type),
  };
}

export const renderNotification = (notification: Notification) => (
  <ListItem
    leading={
      <View className="h-10 w-10 items-center justify-center rounded-full bg-light-secondary/30 dark:bg-dark-subtext/30">
        <Icon name={notification.icon} size={20} />
      </View>
    }
    title={<ThemedText className="font-bold">{notification.title}</ThemedText>}
    subtitle={notification.message}
    trailing={
      <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
        {notification.time}
      </ThemedText>
    }
    className={`py-4 ${!notification.read ? 'bg-light-secondary/5 dark:bg-dark-secondary/5' : ''}`}
  />
);
