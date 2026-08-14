import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import BookingDiscountCodeSheet, {
  type BookingDiscountCodeSheetHandle,
} from '@/components/booking/engine/BookingDiscountCodeSheet';
import BookingGiftVoucherSheet, {
  type BookingGiftVoucherSheetHandle,
} from '@/components/booking/engine/BookingGiftVoucherSheet';

interface BookingCouponSheetsContextValue {
  openDiscountSheet: () => void;
  openGiftVoucherSheet: () => void;
}

const BookingCouponSheetsContext = createContext<BookingCouponSheetsContextValue | null>(null);

export function useBookingCouponSheets() {
  return useContext(BookingCouponSheetsContext);
}

interface Props {
  flow: BookingEngineFlow;
  children: ReactNode;
}

export function BookingCouponSheetsHost({ flow, children }: Props) {
  const discountRef = useRef<BookingDiscountCodeSheetHandle>(null);
  const giftRef = useRef<BookingGiftVoucherSheetHandle>(null);

  const openDiscountSheet = useCallback(() => {
    flow.trackOpenDiscountCode();
    flow.coupon.invalidatePreview();
    setTimeout(() => discountRef.current?.show(), 50);
  }, [flow]);

  const openGiftVoucherSheet = useCallback(() => {
    flow.trackOpenGiftVoucher();
    setTimeout(() => giftRef.current?.show(), 50);
  }, [flow]);

  const value = useMemo(
    () => ({ openDiscountSheet, openGiftVoucherSheet }),
    [openDiscountSheet, openGiftVoucherSheet]
  );

  return (
    <BookingCouponSheetsContext.Provider value={value}>
      {children}
      <BookingDiscountCodeSheet
        ref={discountRef}
        flow={flow}
        coupon={flow.coupon}
        onReserve={flow.handleSubmit}
      />
      <BookingGiftVoucherSheet ref={giftRef} t={flow.t} />
    </BookingCouponSheetsContext.Provider>
  );
}
