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
