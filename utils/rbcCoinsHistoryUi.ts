import type { ImageSourcePropType } from 'react-native';

import type { RbCoinsHistoryItem } from '@/api/rb-coins';
import type { TranslationKey } from '@/locales';

export const VISIT_APP_BONUS_RESERVATION_PREFIX = 'VISIT_APP_BONUS_RESERVATION:';

/** Bonus za rezervaci / PAYMENT — backend může poslat typ VISIT_BONUS nebo jen popis VISIT_APP_BONUS_RESERVATION:* */
export function isVisitReservationBonusTransaction(item: RbCoinsHistoryItem): boolean {
  return (
    item.type === 'VISIT_BONUS' ||
    !!item.description?.startsWith(VISIT_APP_BONUS_RESERVATION_PREFIX)
  );
}

export const RB_COINS_TX_LIST_KEYS_WALLET = {
  giftCard: 'walletHistoryGiftCardCreated',
  cashback: 'walletHistoryCashback',
  visitBonus: 'walletTransactionVisitReservationBonus',
} as const satisfies Record<string, TranslationKey>;

export const RB_COINS_TX_LIST_KEYS_RBC = {
  giftCard: 'rbcGiftCardCreated',
  cashback: 'rbcCashback',
  visitBonus: 'walletTransactionVisitReservationBonus',
} as const satisfies Record<string, TranslationKey>;

export function getRbCoinsTransactionListTitle(
  item: RbCoinsHistoryItem,
  t: (key: TranslationKey) => string,
  keys: {
    readonly giftCard: TranslationKey;
    readonly cashback: TranslationKey;
    readonly visitBonus: TranslationKey;
  }
): string {
  if (item.description?.startsWith('Created gift card:')) return t(keys.giftCard);
  if (item.description?.startsWith('Cashback z nákupu')) return t(keys.cashback);
  if (isVisitReservationBonusTransaction(item)) return t(keys.visitBonus);
  if (item.otherParty?.name) return item.otherParty.name;
  return 'RealBarber';
}

export function getRbCoinsTransactionAvatarSrc(
  item: RbCoinsHistoryItem
): string | ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

export function formatRbCoinsTransactionAmount(
  item: RbCoinsHistoryItem,
  suffix = 'RBC'
): string {
  const value = item.amount.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const amount = suffix ? `${value} ${suffix}` : value;
  return item.direction === 'sent' ? `-${amount}` : `+${amount}`;
}

export function formatRbCoinsTransactionListSubtitle(iso: string, locale: string): string {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const d = new Date(iso);
  const date = d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}
