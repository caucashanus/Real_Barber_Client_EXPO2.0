import { getClientNotifications, getNotificationHistory } from '@/api/notifications';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import { isNotificationRead, loadReadNotificationIds, getReadTrackingBaseline } from '@/utils/notificationReadState';

const PAGE_SIZE = 50;

export async function hasUnreadNotifications(
  apiToken: string,
  clientId: string
): Promise<boolean> {
  if (!apiToken.trim() || !clientId.trim()) return false;

  try {
    const readSet = await loadReadNotificationIds(clientId);
    const baselineMs = await getReadTrackingBaseline(clientId);
    let offset = 0;

    if (CLIENT_APP_V1_ENABLED) {
      while (true) {
        const { items, pagination } = await getClientNotifications(apiToken, {
          limit: PAGE_SIZE,
          offset,
        });

        for (const item of items) {
          const createdAt = item.deliveredAt ?? item.createdAt;
          if (item.id && !isNotificationRead(readSet, item.id, createdAt, baselineMs)) {
            return true;
          }
        }

        if (!pagination?.hasMore || items.length === 0) return false;
        offset += items.length;
      }
    }

    while (true) {
      const { notifications, pagination } = await getNotificationHistory(apiToken, {
        limit: PAGE_SIZE,
        offset,
      });
      const pushItems = notifications.filter(
        (item) => (item.channel ?? '').trim().toUpperCase() === 'PUSH'
      );

      for (const item of pushItems) {
        if (
          item.notificationId &&
          !isNotificationRead(readSet, item.notificationId, item.createdAt, baselineMs)
        ) {
          return true;
        }
      }

      const hasMore = pagination?.hasMore ?? pushItems.length >= PAGE_SIZE;
      if (!hasMore || notifications.length === 0) return false;
      offset += notifications.length;
    }
  } catch {
    return false;
  }
}
