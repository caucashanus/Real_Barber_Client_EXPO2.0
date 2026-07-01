import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Icon from '@/components/Icon';
import SkeletonLoader from '@/components/SkeletonLoader';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import List from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import {
  isNotificationRead,
  loadReadNotificationIds,
  markNotificationRead,
} from '@/utils/notificationReadState';
import { consumePendingNotificationOpen } from '@/utils/pendingNotificationOpen';
import {
  buildNotificationActionHref,
  getNotificationActionLabelKey,
  iconForNotificationCategory,
  matchesNotificationListFilter,
  resolveNotificationDetailAction,
  resolveNotificationUiCategory,
  type NotificationDetailAction,
  type NotificationListFilter,
  type NotificationUiCategory,
} from '@/utils/notificationAction';

type NotificationType = NotificationUiCategory;

interface NotificationListItem {
  id: string;
  category: NotificationUiCategory;
  title: string;
  message: string;
  time: string;
  createdAtIso: string;
  read: boolean;
  icon: ReturnType<typeof iconForNotificationCategory>;
  entityId?: string;
  eventKey?: string;
  entityType?: string;
  source?: string;
  detailAction: NotificationDetailAction;
}

const PAGE_SIZE = 20;

interface NotificationDetailSheetProps {
  notification: NotificationListItem;
  locale: string;
  onPrimaryAction: () => void;
  emptyBodyLabel: string;
  primaryActionLabel: string | null;
}

function NotificationDetailSheet({
  notification,
  locale,
  onPrimaryAction,
  emptyBodyLabel,
  primaryActionLabel,
}: NotificationDetailSheetProps) {
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

      {primaryActionLabel ? (
        <Button
          title={primaryActionLabel}
          variant="primary"
          className="mt-6 w-full"
          onPress={onPrimaryAction}
        />
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const { t, locale } = useTranslation();
  const { apiToken, client } = useAuth();
  const clientId = client?.id ?? '';
  const params = useLocalSearchParams<{ openId?: string | string[] }>();
  const openIdParam = Array.isArray(params.openId) ? params.openId[0] : params.openId;
  const detailSheetRef = useRef<ActionSheetRef>(null);
  const detailNotificationRef = useRef<NotificationListItem | null>(null);
  const pendingOpenHandledRef = useRef(false);
  const [selectedType, setSelectedType] = useState<NotificationListFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationsData, setNotificationsData] = useState<NotificationListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [detailNotification, setDetailNotification] = useState<NotificationListItem | null>(null);

  const withReadState = useCallback(
    (items: NotificationListItem[], readSet: Set<string>) =>
      items.map((item) => ({
        ...item,
        read: isNotificationRead(readSet, item.id),
      })),
    []
  );

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
        const readSet = clientId ? await loadReadNotificationIds(clientId) : new Set<string>();

        if (CLIENT_APP_V1_ENABLED) {
          const { items, pagination } = await getClientNotifications(apiToken, {
            limit: PAGE_SIZE,
            offset: nextOffset,
          });
          const mapped = withReadState(items.map(mapClientItemToNotification), readSet);
          setNotificationsData((prev) => (append ? [...prev, ...mapped] : mapped));
          setHasMore(Boolean(pagination?.hasMore));
          setOffset(nextOffset + items.length);
        } else {
          const { notifications } = await getNotificationHistory(apiToken, {
            limit: PAGE_SIZE,
            offset: nextOffset,
          });
          const mapped = withReadState(
            notifications
              .filter((item) => (item.channel ?? '').trim().toUpperCase() === 'PUSH')
              .map(mapHistoryItemToNotification),
            readSet
          );
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
    [apiToken, clientId, t, withReadState]
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      const id = notificationId.trim();
      if (!id) return;

      setNotificationsData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );

      if (!clientId) return;
      await markNotificationRead(clientId, id);
    },
    [clientId]
  );

  const openDetail = useCallback(
    (notification: NotificationListItem) => {
      detailNotificationRef.current = notification;
      setDetailNotification({ ...notification, read: true });
      void markRead(notification.id);
      setTimeout(() => {
        detailSheetRef.current?.show();
      }, 50);
    },
    [markRead]
  );

  useFocusEffect(
    useCallback(() => {
      pendingOpenHandledRef.current = false;
      void loadPage(0, false);
    }, [loadPage])
  );

  useEffect(() => {
    if (isLoading || pendingOpenHandledRef.current || notificationsData.length === 0) return;

    const targetId = openIdParam?.trim() || consumePendingNotificationOpen();
    if (!targetId) return;

    const found = notificationsData.find((item) => item.id === targetId);
    if (!found) return;

    pendingOpenHandledRef.current = true;
    openDetail(found);
  }, [isLoading, notificationsData, openIdParam, openDetail]);

  const unreadCount = useMemo(
    () => notificationsData.filter((item) => !item.read).length,
    [notificationsData]
  );

  const filteredNotifications = useMemo(
    () =>
      notificationsData.filter((notification) =>
        matchesNotificationListFilter(notification.category, selectedType)
      ),
    [notificationsData, selectedType]
  );

  const closeDetail = useCallback(() => {
    detailSheetRef.current?.hide();
  }, []);

  const handlePrimaryAction = useCallback(() => {
    const notification = detailNotificationRef.current;
    if (!notification) return;
    const href = buildNotificationActionHref(
      notification.detailAction,
      notification.entityId ?? ''
    );
    if (!href) return;
    closeDetail();
    router.push(href as never);
  }, [closeDetail]);

  const activeDetail = detailNotification ?? detailNotificationRef.current;
  const primaryActionLabelKey = activeDetail
    ? getNotificationActionLabelKey(activeDetail.detailAction)
    : null;
  const primaryActionLabel = primaryActionLabelKey ? t(primaryActionLabelKey) : null;

  const unreadSubtitle =
    unreadCount > 0
      ? t('notificationsUnreadSubtitle').replace('{{count}}', String(unreadCount))
      : undefined;

  return (
    <>
      <Header
        showBackButton
        title={t('notificationsHistoryTitle')}
        subtitle={unreadSubtitle}
      />
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
                        <View className="relative">
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-light-secondary/30 dark:bg-dark-subtext/30">
                            <Icon name={notification.icon} size={20} />
                          </View>
                          {!notification.read ? (
                            <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-highlight" />
                          ) : null}
                        </View>
                      }
                      title={
                        <ThemedText
                          className={notification.read ? 'font-medium' : 'font-bold'}
                          numberOfLines={1}>
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
                      className={`px-4 py-4 ${notification.read ? '' : 'bg-light-secondary/5 dark:bg-dark-secondary/10'}`}
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
            primaryActionLabel={primaryActionLabel}
            onPrimaryAction={handlePrimaryAction}
          />
        ) : null}
      </ActionSheetThemed>
    </>
  );
}

function stripHtml(input: string): string {
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

function mapClientItemToNotification(item: ClientNotificationItem): NotificationListItem {
  const semantic = {
    eventKey: item.eventKey,
    entityType: item.entityType,
    entityId: item.entityId,
    source: item.source,
  };
  const category = resolveNotificationUiCategory(semantic);
  const detailAction = resolveNotificationDetailAction(semantic);
  const createdAtIso = item.deliveredAt ?? item.createdAt;
  const message = stripHtml(item.body) || '';

  return {
    id: item.id,
    category,
    title: item.title?.trim() || 'Notification',
    message,
    time: toRelativeTime(createdAtIso),
    createdAtIso,
    read: false,
    icon: iconForNotificationCategory(category),
    entityId: item.entityId,
    eventKey: item.eventKey,
    entityType: item.entityType,
    source: item.source,
    detailAction,
  };
}

function mapHistoryItemToNotification(item: NotificationHistoryItem): NotificationListItem {
  const semantic = {
    eventKey: item.type ?? undefined,
    entityType: item.entityType ?? undefined,
    entityId: undefined,
    source: item.category ?? undefined,
  };
  const category = resolveNotificationUiCategory(semantic);
  const detailAction = resolveNotificationDetailAction(semantic);
  const title = item.title?.trim() || 'Notification';
  const message = stripHtml(item.message ?? '') || '';

  return {
    id: item.notificationId,
    category,
    title,
    message,
    time: toRelativeTime(item.createdAt),
    createdAtIso: item.createdAt,
    read: false,
    icon: iconForNotificationCategory(category),
    entityId: undefined,
    eventKey: item.type ?? undefined,
    entityType: item.entityType ?? undefined,
    source: item.category ?? undefined,
    detailAction,
  };
}
