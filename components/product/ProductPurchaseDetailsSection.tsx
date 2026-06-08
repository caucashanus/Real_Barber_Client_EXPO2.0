import React from 'react';

import type { ClientProductPurchase } from '@/api/products';
import type { Locale } from '@/app/contexts/LanguageContext';
import { ProductFeatureItem } from '@/components/product/ProductFeatureItem';
import type { TranslationKey } from '@/locales';
import {
  formatPurchaseDate,
  purchaseHasCashbackFields,
  purchasePaymentBreakdownRows,
  purchasePaymentMethodLabel,
} from '@/utils/productDetailHelpers';

interface ProductPurchaseDetailsSectionProps {
  purchase: ClientProductPurchase;
  locale: Locale;
  t: (key: TranslationKey) => string;
}

export default function ProductPurchaseDetailsSection({
  purchase,
  locale,
  t,
}: ProductPurchaseDetailsSectionProps) {
  return (
    <>
      <ProductFeatureItem
        icon="Calendar"
        label={t('productPurchaseDate')}
        value={formatPurchaseDate(purchase.purchaseDate, locale)}
      />
      <ProductFeatureItem
        icon="CreditCard"
        label={t('checkoutPaymentMethod')}
        value={purchasePaymentMethodLabel(purchase.paymentMethod, t)}
      />
      <ProductFeatureItem
        icon="Package"
        label={t('productPurchaseQuantity')}
        value={String(purchase.quantity)}
      />
      <ProductFeatureItem
        icon="CircleDollarSign"
        label={t('productPurchaseUnitPrice')}
        value={`${purchase.unitPrice} Kč`}
      />
      <ProductFeatureItem
        icon="Wallet"
        label={t('productPurchaseTotal')}
        value={`${purchase.totalPrice} Kč`}
      />
      {purchase.product.sku ? (
        <ProductFeatureItem icon="Hash" label={t('productSku')} value={purchase.product.sku} />
      ) : null}
      {purchase.notes ? (
        <ProductFeatureItem
          icon="StickyNote"
          label={t('productPurchaseNotes')}
          value={purchase.notes}
        />
      ) : null}
      {purchasePaymentBreakdownRows(purchase) ? (
        <>
          {purchase.totalCash > 0 ? (
            <ProductFeatureItem
              icon="Banknote"
              label={t('paymentMethodCash')}
              value={`${purchase.totalCash} Kč`}
            />
          ) : null}
          {purchase.totalCard > 0 ? (
            <ProductFeatureItem
              icon="CreditCard"
              label={t('paymentMethodCard')}
              value={`${purchase.totalCard} Kč`}
            />
          ) : null}
          {purchase.totalCoins > 0 ? (
            <ProductFeatureItem
              icon="Coins"
              label={t('paymentMethodRbc')}
              value={String(purchase.totalCoins)}
            />
          ) : null}
        </>
      ) : null}
      {purchaseHasCashbackFields(purchase) ? (
        <>
          {purchase.cashbackAmount != null ? (
            <ProductFeatureItem
              icon="Gift"
              label={t('productPurchaseCashback')}
              value={`${purchase.cashbackAmount} ${(purchase.cashbackUnit ?? 'RBC').trim()}`}
            />
          ) : null}
          {purchase.cashbackPaid != null ? (
            <ProductFeatureItem
              icon={purchase.cashbackPaid ? 'CircleCheck' : 'Clock'}
              label={t('productPurchaseCashbackStatus')}
              value={
                purchase.cashbackPaid
                  ? t('productPurchaseCashbackPaid')
                  : t('productPurchaseCashbackPending')
              }
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
