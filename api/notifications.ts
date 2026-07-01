import { fetchClientAppV1, fetchCrm } from './http';

export interface ClientNotificationItem {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  source?: string;
  eventKey?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

export interface ClientNotificationsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GetClientNotificationsOptions {
  limit?: number;
  offset?: number;
}

interface ClientNotificationsResponse {
  items: ClientNotificationItem[];
  pagination: ClientNotificationsPagination;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function pickAnyText(value: unknown): string {
  const direct = pickString(value);
  if (direct) return direct;
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  for (const nested of Object.values(record)) {
    const picked = pickAnyText(nested);
    if (picked) return picked;
  }
  return '';
}

function pickNestedString(source: unknown, ...keys: string[]): string {
  if (!source || typeof source !== 'object') return '';
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const picked = pickString(record[key]);
    if (picked) return picked;
  }
  return '';
}

function pickNotificationBody(
  item: Record<string, unknown>,
  data?: Record<string, unknown>
): string {
  const content =
    item.content && typeof item.content === 'object'
      ? (item.content as Record<string, unknown>)
      : undefined;
  const push =
    item.pushNotification && typeof item.pushNotification === 'object'
      ? (item.pushNotification as Record<string, unknown>)
      : undefined;
  const payload =
    item.payload && typeof item.payload === 'object'
      ? (item.payload as Record<string, unknown>)
      : undefined;

  return pickString(
    item.body,
    item.message,
    item.text,
    typeof item.content === 'string' ? item.content : undefined,
    item.description,
    item.subtitle,
    item.summary,
    pickAnyText(item.body),
    pickAnyText(item.message),
    pickNestedString(content, 'body', 'message', 'text', 'description'),
    pickNestedString(push, 'body', 'message', 'text'),
    pickNestedString(payload, 'body', 'message', 'text'),
    pickNestedString(data, 'body', 'message', 'text', 'description')
  );
}

function normalizeClientNotificationItem(raw: unknown): ClientNotificationItem {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const data =
    item.data && typeof item.data === 'object' ? (item.data as Record<string, unknown>) : undefined;

  return {
    id: String(item.id ?? item.notificationId ?? ''),
    title: pickString(item.title, pickNestedString(data, 'title')) || 'Notification',
    body: pickNotificationBody(item, data),
    status: pickString(item.status),
    createdAt: pickString(item.createdAt),
    deliveredAt: typeof item.deliveredAt === 'string' ? item.deliveredAt : null,
    source: pickString(item.source) || undefined,
    eventKey: pickString(item.eventKey) || undefined,
    entityType: pickString(item.entityType) || undefined,
    entityId: pickString(item.entityId, item.entity_id) || undefined,
    data,
  };
}

function normalizeClientNotificationsResponse(raw: unknown): ClientNotificationsResponse {
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const payload =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  const itemsRaw = payload.items ?? payload.notifications;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(normalizeClientNotificationItem)
    : [];
  const paginationRaw = payload.pagination;
  const pagination: ClientNotificationsPagination =
    paginationRaw && typeof paginationRaw === 'object'
      ? (paginationRaw as ClientNotificationsPagination)
      : {
          total: items.length,
          limit: items.length,
          offset: 0,
          hasMore: false,
        };

  return { items, pagination };
}

/** GET /api/client/app/v1/notifications — push history (SENT / DELIVERED only). */
export async function getClientNotifications(
  apiToken: string,
  options: GetClientNotificationsOptions = {}
): Promise<ClientNotificationsResponse> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  const qs = params.toString();

  const raw = await fetchClientAppV1<unknown>(`/notifications${qs ? `?${qs}` : ''}`, {
    apiToken,
  });

  return normalizeClientNotificationsResponse(raw);
}

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
): Promise<{
  notifications: NotificationHistoryItem[];
  pagination: NotificationHistoryPagination | null;
}> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.type) params.set('type', options.type);
  const qs = params.toString();

  const json = await fetchCrm<NotificationHistoryResponse>(
    `/api/internal/notifications/history${qs ? `?${qs}` : ''}`,
    { apiToken }
  );
  const notifications = json.data?.notifications ?? [];
  const pagination = json.data?.pagination ?? null;
  return { notifications, pagination };
}
