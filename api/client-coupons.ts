import { CRM_BASE } from '@/api/bookings';

export interface ClientCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  benefitLabel: string;
  applicableToAll: boolean;
  validFrom: string;
  validUntil: string | null;
  isPublic: boolean;
}

/** GET /api/client/coupons — kupony dostupné klientovi (server filtruje neplatné řádky). */
export async function getClientCoupons(apiToken: string): Promise<ClientCoupon[]> {
  const res = await fetch(`${CRM_BASE}/api/client/coupons`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as ClientCoupon[];
}
