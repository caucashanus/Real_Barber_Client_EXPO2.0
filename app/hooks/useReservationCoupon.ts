import { useCallback, useEffect, useState } from 'react';

import { previewCoupon, type CouponPreviewSuccess } from '@/api/coupons';
import type { TranslationKey } from '@/locales';
import type { ReservationFlowData } from '@/utils/reservationCreateHelpers';

interface UseReservationCouponParams {
  apiToken: string | null;
  data: ReservationFlowData;
  t: (key: TranslationKey) => string;
}

export function useReservationCoupon({ apiToken, data, t }: UseReservationCouponParams) {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponPreviewSuccess | null>(null);
  const [couponPreviewError, setCouponPreviewError] = useState<string | null>(null);
  const [couponVerifying, setCouponVerifying] = useState(false);

  useEffect(() => {
    setCouponPreview(null);
    setCouponPreviewError(null);
  }, [data.employeeId, data.branchId, data.itemId]);

  const onCouponCodeChange = useCallback((text: string) => {
    setCouponCodeInput(text);
    setCouponPreview(null);
    setCouponPreviewError(null);
  }, []);

  const handleVerifyCoupon = useCallback(async () => {
    if (!apiToken || couponVerifying) return;
    const code = couponCodeInput.trim();
    if (!code) {
      setCouponPreviewError(t('reservationCouponEmpty'));
      return;
    }
    if (!data.employeeId || !data.branchId || !data.itemId) {
      setCouponPreviewError(t('reservationCouponIncompleteSelection'));
      return;
    }
    setCouponPreviewError(null);
    setCouponVerifying(true);
    try {
      const preview = await previewCoupon(apiToken, {
        couponCode: code,
        employeeId: data.employeeId,
        branchId: data.branchId,
        itemId: data.itemId,
      });
      setCouponPreview(preview);
    } catch (e) {
      setCouponPreview(null);
      setCouponPreviewError(e instanceof Error ? e.message : t('reservationCouponVerifyFailed'));
    } finally {
      setCouponVerifying(false);
    }
  }, [apiToken, couponVerifying, couponCodeInput, data.employeeId, data.branchId, data.itemId, t]);

  return {
    couponCodeInput,
    couponPreview,
    couponPreviewError,
    couponVerifying,
    onCouponCodeChange,
    handleVerifyCoupon,
  };
}
