import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { RbCoinsHistoryItem } from '@/api/rb-coins';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { isVisitReservationBonusTransaction } from '@/utils/rbcCoinsHistoryUi';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateTime(iso: string, locale: string): { date: string; time: string } {
  const d = new Date(iso);
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return {
    date: d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
  };
}

function getDetailDescription(tx: RbCoinsHistoryItem, t: (key: TranslationKey) => string): string {
  if (isVisitReservationBonusTransaction(tx)) return t('walletTransactionVisitReservationDetail');
  if (tx.description?.startsWith('Created gift card:')) {
    const code = tx.description.replace('Created gift card:', '').trim();
    const label = t('walletHistoryGiftCardCreated');
    return code ? `${label} – ${code}` : label;
  }
  if (tx.description?.startsWith('Cashback z nákupu')) return tx.description;
  if (tx.description?.trim()) return tx.description.trim();
  return '–';
}

function transactionAvatarSrc(
  item: RbCoinsHistoryItem
): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

interface TransactionDetailContentProps {
  transaction: RbCoinsHistoryItem;
  onClose: () => void;
}

function TransactionDetailContent({ transaction, onClose }: TransactionDetailContentProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const setTransferRecipient = useSetTransferRecipient();

  const getTypeLabel = (tx: RbCoinsHistoryItem): string => {
    if (isVisitReservationBonusTransaction(tx)) return t('walletTransactionVisitReservationBonus');
    switch (tx.type) {
      case 'TRANSFER':
        return t('walletDetailTransfer');
      case 'CASHBACK':
        return t('walletDetailCashback');
      case 'DEPOSIT':
        return t('walletDetailLoyaltyReward');
      case 'WITHDRAWAL':
        return t('walletDetailPayment');
      default:
        return t('walletDetailTransaction');
    }
  };
  const getDirectionLabel = (direction: string): string =>
    direction === 'sent' ? t('walletDetailSent') : t('walletDetailReceived');

  const isTransfer = transaction.type === 'TRANSFER' && transaction.otherParty;
  const handleSend = () => {
    if (!transaction.otherParty) return;
    const { id, name, type, avatarUrl } = transaction.otherParty;
    const recType = type && String(type).toUpperCase() === 'EMPLOYEE' ? 'EMPLOYEE' : 'CLIENT';
    setTransferRecipient({
      id: String(id),
      name: name ?? '',
      type: recType,
      avatarUrl: avatarUrl ?? undefined,
    });
    onClose();
    const recId = String(id);
    const q = new URLSearchParams({
      name: name ?? '',
      type: recType,
      avatarUrl: avatarUrl ?? '',
    });
    router.push(`/screens/transfer-chat/${recId}?${q.toString()}`);
  };

  const isSent = transaction.direction === 'sent';
  const amountStr = `${isSent ? '-' : '+'}${formatBalance(transaction.amount)} RBC`;
  const dateTime = formatDateTime(transaction.createdAt, locale);
  const updatedDateTime =
    transaction.updatedAt && transaction.updatedAt !== transaction.createdAt
      ? formatDateTime(transaction.updatedAt, locale)
      : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="px-global pb-8 pt-2">
      <View className="mb-4 flex-row items-center">
        <Avatar src={transactionAvatarSrc(transaction)} size="md" />
        <View className="ml-3 flex-1">
          <ThemedText className="text-base font-semibold">{getTypeLabel(transaction)}</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {getDirectionLabel(transaction.direction)}
          </ThemedText>
        </View>
      </View>

      <ThemedText
        className={`my-4 text-center text-2xl font-bold ${isSent ? 'text-light-text dark:text-dark-text' : 'text-green-600 dark:text-green-400'}`}>
        {amountStr}
      </ThemedText>

      <View className="gap-4 border-t border-light-secondary pt-2 dark:border-dark-secondary">
        <View>
          <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('walletDetailPaymentNote')}
          </ThemedText>
          <ThemedText className="text-base">{getDetailDescription(transaction, t)}</ThemedText>
        </View>

        {transaction.otherParty && (
          <View>
            <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
              {transaction.direction === 'sent'
                ? t('walletDetailRecipient')
                : t('walletDetailSender')}
            </ThemedText>
            <View className="flex-row items-center gap-2">
              <Avatar src={transactionAvatarSrc(transaction)} size="sm" />
              <View>
                <ThemedText className="text-base font-medium">{transaction.otherParty.name}</ThemedText>
                {transaction.otherParty.identifier && (
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {transaction.otherParty.identifier}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}

        {transaction.performedBy && (
          <View>
            <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
              {t('walletDetailPerformedBy')}
            </ThemedText>
            <ThemedText className="text-base">{transaction.performedBy.name}</ThemedText>
          </View>
        )}

        <View>
          <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('walletDetailDateAndTime')}
          </ThemedText>
          <ThemedText className="text-base">{dateTime.date}</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {dateTime.time}
          </ThemedText>
        </View>

        {updatedDateTime && (
          <View>
            <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
              {t('walletDetailUpdated')}
            </ThemedText>
            <ThemedText className="text-base">{updatedDateTime.date}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {updatedDateTime.time}
            </ThemedText>
          </View>
        )}

        <View>
          <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('walletDetailTransactionId')}
          </ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {transaction.id}
          </ThemedText>
        </View>

        {isTransfer ? (
          <Button
            title={t('walletDetailSend')}
            variant="primary"
            className="mt-4 w-full"
            onPress={handleSend}
          />
        ) : null}
      </View>
      </View>
    </ScrollView>
  );
}

export interface TransactionDetailSheetProps {
  transaction: RbCoinsHistoryItem | null;
  visible: boolean;
  onClose: () => void;
}

export default function TransactionDetailSheet({
  transaction,
  visible,
  onClose,
}: TransactionDetailSheetProps) {
  const sheetRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    if (visible && transaction) {
      const timer = setTimeout(() => sheetRef.current?.show(), 50);
      return () => clearTimeout(timer);
    }
    sheetRef.current?.hide();
  }, [visible, transaction?.id]);

  return (
    <ActionSheetThemed ref={sheetRef} gestureEnabled onClose={onClose}>
      {transaction ? (
        <TransactionDetailContent key={transaction.id} transaction={transaction} onClose={onClose} />
      ) : null}
    </ActionSheetThemed>
  );
}
