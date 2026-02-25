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

/** GET /api/rb-coins/history – RBC transaction history. */
export async function getRbCoinsHistory(apiToken: string): Promise<RbCoinsHistoryResponse> {
  const res = await fetch(`${CRM_BASE}/api/rb-coins/history`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<RbCoinsHistoryResponse>;
}
