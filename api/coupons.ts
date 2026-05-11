import { CRM_BASE } from '@/api/bookings';

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

function parseApiErrorMessage(text: string, status: number): string {
  let msg = `Error ${status}`;
  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string };
    if (parsed?.message) msg = parsed.message;
    else if (typeof parsed?.error === 'string') msg = parsed.error;
    else if (text) msg = `${msg}: ${text.slice(0, 200)}`;
  } catch {
    if (text) msg = `${msg}: ${text.slice(0, 200)}`;
  }
  return msg;
}

/** POST /api/client/coupons/preview — náhled ceny bez spotřebování kupónu. */
export async function previewCoupon(
  apiToken: string,
  body: CouponPreviewBody
): Promise<CouponPreviewSuccess> {
  const url = `${CRM_BASE}/api/client/coupons/preview`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    throw new Error(parseApiErrorMessage(text, res.status));
  }
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid response from server');
  }
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
