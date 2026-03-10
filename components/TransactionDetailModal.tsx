import React from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import type { RbCoinsHistoryItem } from '@/api/rb-coins';
import { useTranslation } from '@/app/hooks/useTranslation';

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

function getDetailDescription(tx: RbCoinsHistoryItem, t: (key: string) => string): string {
  if (tx.description?.trim()) return tx.description.trim();
  if (tx.description?.startsWith('Created gift card:')) {
    const code = tx.description.replace('Created gift card:', '').trim();
    const label = t('walletHistoryGiftCardCreated');
    return code ? `${label} – ${code}` : label;
  }
  if (tx.description?.startsWith('Cashback z nákupu')) return tx.description;
  return '–';
}

function transactionAvatarSrc(item: RbCoinsHistoryItem): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

interface TransactionDetailModalProps {
  transaction: RbCoinsHistoryItem | null;
  visible: boolean;
  onClose: () => void;
}

export default function TransactionDetailModal({
  transaction,
  visible,
  onClose,
}: TransactionDetailModalProps) {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setTransferRecipient = useSetTransferRecipient();

  if (!transaction) return null;

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'TRANSFER': return t('walletDetailTransfer');
      case 'CASHBACK': return t('walletDetailCashback');
      case 'DEPOSIT': return t('walletDetailLoyaltyReward');
      case 'WITHDRAWAL': return t('walletDetailPayment');
      default: return t('walletDetailTransaction');
    }
  };
  const getDirectionLabel = (direction: string): string =>
    direction === 'sent' ? t('walletDetailSent') : t('walletDetailReceived');

  const isTransfer = transaction.type === 'TRANSFER' && transaction.otherParty;
  const handleOdeslat = () => {
    if (!transaction.otherParty) return;
    const { id, name, type, avatarUrl } = transaction.otherParty;
    const recType = (type && String(type).toUpperCase() === 'EMPLOYEE') ? 'EMPLOYEE' : 'CLIENT';
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
  const updatedDateTime = transaction.updatedAt && transaction.updatedAt !== transaction.createdAt
    ? formatDateTime(transaction.updatedAt, locale)
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          className="bg-light-primary dark:bg-dark-primary rounded-t-2xl overflow-hidden"
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 20,
              paddingTop: 16,
            },
          ]}
        >
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon name="X" size={24} />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-row items-center mb-4">
              <Avatar src={transactionAvatarSrc(transaction)} size="md" />
              <View className="ml-3 flex-1">
                <ThemedText className="text-base font-semibold">{getTypeLabel(transaction.type)}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{getDirectionLabel(transaction.direction)}</ThemedText>
              </View>
            </View>
            <ThemedText
              className={`text-2xl font-bold text-center my-4 ${isSent ? 'text-light-text dark:text-dark-text' : 'text-green-600 dark:text-green-400'}`}
            >
              {amountStr}
            </ThemedText>

            <View className="gap-4 pt-2 border-t border-light-secondary dark:border-dark-secondary">
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">{t('walletDetailPaymentNote')}</ThemedText>
                <ThemedText className="text-base">{getDetailDescription(transaction, t)}</ThemedText>
              </View>
              {transaction.otherParty && (
                <View>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">
                    {transaction.direction === 'sent' ? t('walletDetailRecipient') : t('walletDetailSender')}
                  </ThemedText>
                  <View className="flex-row items-center gap-2">
                    <Avatar src={transactionAvatarSrc(transaction)} size="sm" />
                    <View>
                      <ThemedText className="text-base font-medium">{transaction.otherParty.name}</ThemedText>
                      {transaction.otherParty.identifier && (
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{transaction.otherParty.identifier}</ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              )}
              {transaction.performedBy && (
                <View>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">{t('walletDetailPerformedBy')}</ThemedText>
                  <ThemedText className="text-base">{transaction.performedBy.name}</ThemedText>
                </View>
              )}
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">{t('walletDetailDateAndTime')}</ThemedText>
                <ThemedText className="text-base">{dateTime.date}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{dateTime.time}</ThemedText>
              </View>
              {updatedDateTime && (
                <View>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">{t('walletDetailUpdated')}</ThemedText>
                  <ThemedText className="text-base">{updatedDateTime.date}</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{updatedDateTime.time}</ThemedText>
                </View>
              )}
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-wide mb-1">{t('walletDetailTransactionId')}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{transaction.id}</ThemedText>
              </View>
              {isTransfer && (
                <Pressable
                  onPress={handleOdeslat}
                  className="mt-4 py-3 rounded-xl bg-highlight items-center active:opacity-80"
                >
                  <ThemedText className="text-base font-semibold text-white">{t('walletDetailSend')}</ThemedText>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%' },
  closeButton: { position: 'absolute', top: 16, right: 20, zIndex: 10, padding: 8 },
  scrollContent: { paddingTop: 36, paddingBottom: 16 },
});
