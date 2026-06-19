import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { resolveClientCouponValidity } from '@/utils/clientCouponFormat';

export type ClientCouponValidityPillsVariant = 'cardImage' | 'cardSolid' | 'sheet';

export interface ClientCouponValidityPillsProps {
  validFrom: string;
  validUntil: string | null;
  locale: string;
  /** i18n — klíč: homeCouponValidityPillUntil */
  t: (key: TranslationKey) => string;
  variant: ClientCouponValidityPillsVariant;
  /** For flex alignment on cards (end = bottom-right block) */
  align?: 'start' | 'end';
}

const VARIANT_CLASSES: Record<
  ClientCouponValidityPillsVariant,
  {
    pill: string;
    prefix: string;
    value: string;
  }
> = {
  cardImage: {
    pill: 'rounded-full border border-white/25 bg-black/50 px-2 py-0.5',
    prefix: 'text-[10px] text-white/80',
    value: 'text-[10px] font-archivo text-white',
  },
  cardSolid: {
    pill: 'rounded-full border border-neutral-200 bg-light-primary px-2 py-0.5 dark:border-dark-secondary dark:bg-dark-secondary',
    prefix: 'text-[10px] text-light-subtext dark:text-dark-subtext',
    value: 'text-[10px] font-archivo text-light-text dark:text-dark-text',
  },
  sheet: {
    pill: 'rounded-full border border-neutral-200 bg-light-secondary px-3 py-1.5 dark:border-dark-secondary dark:bg-dark-secondary',
    prefix: 'text-xs text-light-subtext dark:text-dark-subtext',
    value: 'text-sm font-archivo text-light-text dark:text-dark-text',
  },
};

export function ClientCouponValidityPills({
  validFrom,
  validUntil,
  locale,
  t,
  variant,
  align = 'start',
}: ClientCouponValidityPillsProps) {
  const model = resolveClientCouponValidity(validFrom, validUntil, locale);
  if (!model) return null;

  const c = VARIANT_CLASSES[variant];
  const justify = align === 'end' ? 'justify-end' : 'justify-start';

  return (
    <View className={`flex-row flex-wrap gap-1 ${justify}`} pointerEvents="none">
      <View className={c.pill}>
        <ThemedText className={c.prefix}>
          {t('homeCouponValidityPillUntil')}{' '}
          <ThemedText className={c.value}>{model.untilDisplay}</ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}