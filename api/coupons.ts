import { fetchCrm } from './http';

export interface CouponPreviewBody {
  couponCode: string;
  employeeId: string;
  branchId: string;
  itemId: string;
}

export interface CouponPreviewSuccess {
  success: boolean;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  couponCode: string;
  couponName?: string;
}

function parseNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function unwrapRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o && o.data && typeof o.data === 'object') {
    return o.data as Record<string, unknown>;
  }
  return o;
}

/** POST /api/client/coupons/preview — náhled ceny bez spotřebování kupónu. */
export async function previewCoupon(
  apiToken: string,
  body: CouponPreviewBody
): Promise<CouponPreviewSuccess> {
  const raw = await fetchCrm<unknown>('/api/client/coupons/preview', {
    method: 'POST',
    apiToken,
    body,
  });

  const obj = unwrapRecord(raw);
  if (!obj) throw new Error('Invalid response from server');

  const originalPrice = parseNumber(obj.originalPrice);
  const discountAmount = parseNumber(obj.discountAmount);
  const finalPrice = parseNumber(obj.finalPrice);
  if (originalPrice === undefined || discountAmount === undefined || finalPrice === undefined) {
    throw new Error('Invalid coupon preview response');
  }
  const couponCode =
    typeof obj.couponCode === 'string' && obj.couponCode.trim() !== ''
      ? obj.couponCode
      : body.couponCode;
  const couponName = typeof obj.couponName === 'string' ? obj.couponName : undefined;
  const success = obj.success !== false;

  return {
    success,
    originalPrice,
    discountAmount,
    finalPrice,
    couponCode,
    couponName,
  };
}
