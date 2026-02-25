const CRM_BASE = 'https://crm.xrb.cz';

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
  const res = await fetch(`${CRM_BASE}/api/rb-coins/balance`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<RbCoinsBalanceResponse>;
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
  const url = `${CRM_BASE}/api/rb-coins/history${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<RbCoinsHistoryResponse>;
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
  const res = await fetch(`${CRM_BASE}/api/rb-coins/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<RbCoinsHistoryItem>;
}
