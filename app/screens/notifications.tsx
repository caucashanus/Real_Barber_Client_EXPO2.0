import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import {
  getClientNotifications,
  getNotificationHistory,
  type ClientNotificationItem,
  type NotificationHistoryItem,
} from '@/api/notifications';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import SkeletonLoader from '@/components/SkeletonLoader';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
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

interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  createdAtIso: string;
  icon: IconName;
  entityId?: string;
  deepLinkScreen?: string;
}

const PAGE_SIZE = 20;

interface NotificationDetailSheetProps {
  notification: NotificationListItem;
  locale: string;
  onViewBooking: () => void;
  emptyBodyLabel: string;
  viewBookingLabel: string;
}

function NotificationDetailSheet({
  notification,
  locale,
  onViewBooking,
  emptyBodyLabel,
  viewBookingLabel,
}: NotificationDetailSheetProps) {
  const bookingHref = getBookingDetailHref(notification);
  const bodyText = notification.message.trim();

  return (
    <View className="px-global pb-8 pt-2">
      <View className="mb-4 flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
          <Icon name={notification.icon} size={22} />
        </View>
        <View className="min-w-0 flex-1">
          <ThemedText className="text-lg font-semibold">{notification.title}</ThemedText>
          <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
            {formatNotificationDateTime(notification.createdAtIso, locale)}
          </ThemedText>
        </View>
      </View>

      <ThemedText className="text-base leading-6 text-light-subtext dark:text-dark-subtext">
        {bodyText || emptyBodyLabel}
      </ThemedText>

      {bookingHref ? (
        <Button
          title={viewBookingLabel}
          variant="primary"
          className="mt-6 w-full"
          onPress={onViewBooking}
        />
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const { t, locale } = useTranslation();
  const { apiToken } = useAuth();
  const detailSheetRef = useRef<ActionSheetRef>(null);
  const detailNotificationRef = useRef<NotificationListItem | null>(null);
  const [selectedType, setSelectedType] = useState<NotificationType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationsData, setNotificationsData] = useState<NotificationListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [detailNotification, setDetailNotification] = useState<NotificationListItem | null>(null);

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!apiToken) {
        setNotificationsData([]);
        setLoadError(null);
        setHasMore(false);
        setOffset(0);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      if (append) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        if (CLIENT_APP_V1_ENABLED) {
          const { items, pagination } = await getClientNotifications(apiToken, {
            limit: PAGE_SIZE,
            offset: nextOffset,
          });
          const mapped = items.map(mapClientItemToNotification);
          setNotificationsData((prev) => (append ? [...prev, ...mapped] : mapped));
          setHasMore(Boolean(pagination?.hasMore));
          setOffset(nextOffset + items.length);
        } else {
          const { notifications } = await getNotificationHistory(apiToken, {
            limit: PAGE_SIZE,
            offset: nextOffset,
          });
          const mapped = notifications
            .filter((item) => (item.channel ?? '').trim().toUpperCase() === 'PUSH')
            .map(mapHistoryItemToNotification);
          setNotificationsData((prev) => (append ? [...prev, ...mapped] : mapped));
          setHasMore(mapped.length >= PAGE_SIZE);
          setOffset(nextOffset + mapped.length);
        }
      } catch (error) {
        if (!append) {
          setNotificationsData([]);
          setLoadError(error instanceof Error ? error.message : t('commonError'));
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [apiToken, t]
  );

  useFocusEffect(
    useCallback(() => {
      void loadPage(0, false);
    }, [loadPage])
  );

  const filteredNotifications = useMemo(
    () =>
      notificationsData.filter((notification) =>
        selectedType === 'all' ? true : notification.type === selectedType
      ),
    [notificationsData, selectedType]
  );

  const openDetail = useCallback((notification: NotificationListItem) => {
    detailNotificationRef.current = notification;
    setDetailNotification(notification);
    setTimeout(() => {
      detailSheetRef.current?.show();
    }, 50);
  }, []);

  const closeDetail = useCallback(() => {
    detailSheetRef.current?.hide();
  }, []);

  const handleViewBooking = useCallback(() => {
    const notification = detailNotificationRef.current;
    if (!notification) return;
    const href = getBookingDetailHref(notification);
    if (!href) return;
    closeDetail();
    router.push(href as never);
  }, [closeDetail]);

  const activeDetail = detailNotification ?? detailNotificationRef.current;

  return (
    <>
      <Header showBackButton title={t('notificationsHistoryTitle')} />
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
            <>
              <List variant="divided">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <ListItem
                      key={notification.id}
                      onPress={() => openDetail(notification)}
                      leading={
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-light-secondary/30 dark:bg-dark-subtext/30">
                          <Icon name={notification.icon} size={20} />
                        </View>
                      }
                      title={
                        <ThemedText className="font-bold" numberOfLines={1}>
                          {notification.title}
                        </ThemedText>
                      }
                      subtitle={notification.message || undefined}
                      trailing={
                        <View className="flex-row items-center gap-2">
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {notification.time}
                          </ThemedText>
                          <Icon
                            name="ChevronRight"
                            size={18}
                            className="text-light-subtext dark:text-dark-subtext"
                          />
                        </View>
                      }
                      className="px-4 py-4"
                    />
                  ))
                ) : (
                  <View className="items-center p-8">
                    <ThemedText>{t('notificationsNoFound')}</ThemedText>
                  </View>
                )}
              </List>
              {hasMore ? (
                <View className="items-center px-4 py-6">
                  <Button
                    title={t('notificationsLoadMore')}
                    variant="outline"
                    size="small"
                    loading={isLoadingMore}
                    onPress={() => {
                      void loadPage(offset, true);
                    }}
                  />
                </View>
              ) : null}
            </>
          )}
        </ThemedScroller>
      </View>

      <ActionSheetThemed
        ref={detailSheetRef}
        gestureEnabled
        onClose={() => {
          detailNotificationRef.current = null;
          setDetailNotification(null);
        }}>
        {activeDetail ? (
          <NotificationDetailSheet
            key={activeDetail.id}
            notification={activeDetail}
            locale={locale}
            emptyBodyLabel={t('notificationsDetailEmptyBody')}
            viewBookingLabel={t('reservationsViewBooking')}
            onViewBooking={handleViewBooking}
          />
        ) : null}
      </ActionSheetThemed>
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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
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

function formatNotificationDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return d.toLocaleString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBookingDetailHref(notification: NotificationListItem): string | null {
  const entityId = notification.entityId?.trim();
  if (!entityId) return null;

  const screen = normalizeForMatch(notification.deepLinkScreen);
  const type = notification.type;

  if (screen === 'booking' || type === 'booking') {
    return `/screens/booking-detail?id=${encodeURIComponent(entityId)}`;
  }
  return null;
}

function mapClientItemToNotification(item: ClientNotificationItem): NotificationListItem {
  const type = mapClientItemType(item);
  const createdAtIso = item.deliveredAt ?? item.createdAt;
  const message = stripHtml(item.body) || '';

  return {
    id: item.id,
    type,
    title: item.title?.trim() || 'Notification',
    message,
    time: toRelativeTime(createdAtIso),
    createdAtIso,
    icon: iconForType(type),
    entityId: item.entityId,
    deepLinkScreen: typeof item.data?.screen === 'string' ? item.data.screen : undefined,
  };
}

function mapClientItemType(item: ClientNotificationItem): NotificationType {
  const joined = [
    normalizeForMatch(item.eventKey),
    normalizeForMatch(item.entityType),
    normalizeForMatch(typeof item.data?.screen === 'string' ? item.data.screen : ''),
    normalizeForMatch(item.title),
    normalizeForMatch(item.body),
  ].join(' ');

  if (joined.includes('cancel')) return 'cancellation';
  if (
    joined.includes('reservation') ||
    joined.includes('booking') ||
    joined.includes('rezervac')
  ) {
    return 'booking';
  }
  if (joined.includes('payment') || joined.includes('platb') || joined.includes('rbc')) {
    return 'payment';
  }
  if (joined.includes('review') || joined.includes('recenz')) return 'review';
  if (joined.includes('inquiry') || joined.includes('dotaz') || joined.includes('question')) {
    return 'inquiry';
  }
  if (joined.includes('message') || joined.includes('zpr')) return 'message';
  return 'all';
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
  if (joined.includes('payment') || joined.includes('platb') || joined.includes('rbc'))
    return 'payment';
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

function mapHistoryItemToNotification(item: NotificationHistoryItem): NotificationListItem {
  const type = mapHistoryTypeToUiType(item);
  const title = item.title?.trim() || 'Notification';
  const message = stripHtml(item.message) || '';
  return {
    id: item.notificationId,
    type,
    title,
    message,
    time: toRelativeTime(item.createdAt),
    createdAtIso: item.createdAt,
    icon: iconForType(type),
    entityId: undefined,
    deepLinkScreen: undefined,
  };
}
