import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  normalizeCouponCode,
  previewCoupon,
  type CouponPreviewSuccess,
} from '@/api/coupons';
import type { TranslationKey } from '@/locales';

export type BookingCouponContext = {
  employeeId?: string | null;
  branchId?: string | null;
  itemId?: string | null;
  phone?: string | null;
  email?: string | null;
  slotStart?: string | null;
  date?: string | null;
};

interface UseBookingEngineCouponParams {
  apiToken: string | null;
  context: BookingCouponContext;
  t: (key: TranslationKey) => string;
  onVerified?: (preview: CouponPreviewSuccess) => void;
  onInvalid?: (message: string) => void;
}

export function useBookingEngineCoupon({
  apiToken,
  context,
  t,
  onVerified,
  onInvalid,
}: UseBookingEngineCouponParams) {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [preview, setPreview] = useState<CouponPreviewSuccess | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  const invalidatePreview = useCallback(() => {
    setCouponCodeInput('');
    setPreview(null);
    setPreviewError(null);
    setVerifiedCode(null);
  }, []);

  useEffect(() => {
    invalidatePreview();
  }, [
    context.employeeId,
    context.branchId,
    context.itemId,
    context.phone,
    context.slotStart,
    context.date,
    invalidatePreview,
  ]);

  const couponEligible = useMemo(() => {
    if (!context.employeeId || context.employeeId === 'any') return false;
    if (!context.branchId || !context.itemId) return false;
    if (!context.slotStart || !context.date) return false;
    const phoneDigits = (context.phone ?? '').replace(/\D/g, '');
    if (phoneDigits.length < 9) return false;
    return true;
  }, [context]);

  const onCouponCodeChange = useCallback((text: string) => {
    setCouponCodeInput(text);
    setPreview(null);
    setPreviewError(null);
    setVerifiedCode(null);
  }, []);

  const handleVerifyCoupon = useCallback(async () => {
    if (!apiToken || verifying) return;
    const code = normalizeCouponCode(couponCodeInput);
    if (!code) {
      setPreviewError(t('reservationCouponEmpty'));
      return;
    }
    if (!couponEligible) {
      setPreviewError(t('reservationCouponIncompleteSelection'));
      return;
    }
    setPreviewError(null);
    setVerifying(true);
    try {
      const result = await previewCoupon(apiToken, {
        couponCode: code,
        employeeId: context.employeeId!,
        branchId: context.branchId!,
        itemId: context.itemId!,
        ...(context.phone ? { phone: context.phone } : {}),
        ...(context.email ? { email: context.email } : {}),
      });
      setPreview(result);
      setVerifiedCode(result.couponCode);
      onVerified?.(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('reservationCouponVerifyFailed');
      setPreview(null);
      setVerifiedCode(null);
      setPreviewError(message);
      onInvalid?.(message);
    } finally {
      setVerifying(false);
    }
  }, [
    apiToken,
    verifying,
    couponCodeInput,
    couponEligible,
    context,
    t,
    onVerified,
    onInvalid,
  ]);

  const dismissDiscountSheet = useCallback(() => {
    invalidatePreview();
  }, [invalidatePreview]);

  const commitFromDiscountSheet = useCallback(() => {
    // Keep verified code + preview for create payload after sheet closes.
  }, []);

  const couponCodeForSubmit = verifiedCode && preview ? verifiedCode : null;

  return {
    couponCodeInput,
    preview,
    previewError,
    verifying,
    couponEligible,
    couponCodeForSubmit,
    onCouponCodeChange,
    handleVerifyCoupon,
    dismissDiscountSheet,
    commitFromDiscountSheet,
    invalidatePreview,
  };
}

export type BookingEngineCoupon = ReturnType<typeof useBookingEngineCoupon>;
