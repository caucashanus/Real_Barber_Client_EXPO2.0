const CRM_BASE = 'https://crm.xrb.cz';

export interface NotificationHistoryRecipient {
  type?: string;
  id?: string;
  name?: string;
  email?: string;
}

export interface NotificationHistoryItem {
  notificationId: string;
  type?: string | null;
  actorType?: string | null;
  relatedEntity?: string | null;
  title?: string | null;
  message?: string | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
  channel?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  entityType?: string | null;
  recipient?: NotificationHistoryRecipient | null;
}

export interface NotificationHistoryPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GetNotificationHistoryOptions {
  limit?: number;
  offset?: number;
  type?: string;
}

interface NotificationHistoryResponse {
  success: boolean;
  data?: {
    notifications?: NotificationHistoryItem[];
    pagination?: NotificationHistoryPagination;
  };
}

/** GET /api/internal/notifications/history for current client token. */
export async function getNotificationHistory(
  apiToken: string,
  options: GetNotificationHistoryOptions = {}
): Promise<{ notifications: NotificationHistoryItem[]; pagination: NotificationHistoryPagination | null }> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.type) params.set('type', options.type);
  const qs = params.toString();
  const url = `${CRM_BASE}/api/internal/notifications/history${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const json = (await res.json()) as NotificationHistoryResponse;
  const notifications = json.data?.notifications ?? [];
  const pagination = json.data?.pagination ?? null;
  return { notifications, pagination };
}
