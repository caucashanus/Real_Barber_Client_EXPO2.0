import { fetchCrm } from './http';

export interface RbCoinsBalanceEntity {
  id: string;
  name: string;
  phone: string;
  type: string;
}

export interface RbCoinsBalanceResponse {
  balance: number;
  entity: RbCoinsBalanceEntity;
}

/** GET /api/rb-coins/balance – current RBC balance for the authenticated client. */
export async function getRbCoinsBalance(apiToken: string): Promise<RbCoinsBalanceResponse> {
  return fetchCrm<RbCoinsBalanceResponse>('/api/rb-coins/balance', { apiToken });
}

export interface RbCoinsHistoryItemOtherParty {
  id: string;
  name: string;
  identifier?: string;
  avatarUrl?: string | null;
  type: string;
}

export interface RbCoinsHistoryItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  direction: 'sent' | 'received';
  otherParty: RbCoinsHistoryItemOtherParty | null;
  performedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface RbCoinsHistoryResponse {
  data: RbCoinsHistoryItem[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface GetRbCoinsHistoryParams {
  limit?: number;
  page?: number;
}

/** GET /api/rb-coins/history – RBC transaction history. */
export async function getRbCoinsHistory(
  apiToken: string,
  params?: GetRbCoinsHistoryParams
): Promise<RbCoinsHistoryResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.page != null) search.set('page', String(params.page));
  const qs = search.toString();

  const parsed = await fetchCrm<RbCoinsHistoryResponse>(
    `/api/rb-coins/history${qs ? `?${qs}` : ''}`,
    { apiToken }
  );
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  /** Nulové částky nemá UI zobrazovat (např. technické řádky z CRM). */
  const data = rows.filter((tx) => Number(tx.amount) !== 0);

  return { ...parsed, data };
}

export interface RbCoinsTransferParams {
  amount: number;
  receiverType: 'CLIENT' | 'EMPLOYEE';
  receiverId: string;
  description?: string;
}

/** POST /api/rb-coins/transfer – send RBC to another user. */
export async function rbCoinsTransfer(
  apiToken: string,
  params: RbCoinsTransferParams
): Promise<RbCoinsHistoryItem> {
  return fetchCrm<RbCoinsHistoryItem>('/api/rb-coins/transfer', {
    method: 'POST',
    apiToken,
    body: params,
  });
}
