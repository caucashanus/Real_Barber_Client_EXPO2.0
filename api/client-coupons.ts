import { fetchCrm } from './http';

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
  const data = await fetchCrm<unknown>('/api/client/coupons', { apiToken });
  if (!Array.isArray(data)) return [];
  return data as ClientCoupon[];
}
