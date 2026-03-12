import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTransferRecipient, useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';
import {
  getRbCoinsBalance,
  getRbCoinsHistory,
  rbCoinsTransfer,
  type RbCoinsHistoryItem,
} from '@/api/rb-coins';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatChatDate(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 24) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffInHours < 48) return t('transferChatYesterday');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function recipientAvatarUrl(tx: RbCoinsHistoryItem): string | undefined {
  return tx.otherParty?.avatarUrl ?? undefined;
}

export default function TransferChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const recipientFromContext = useTransferRecipient();
  const setTransferRecipient = useSetTransferRecipient();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    type?: string;
    avatarUrl?: string;
  }>();
  const id = recipientFromContext?.id ?? params.id ?? '';
  const name = recipientFromContext?.name ?? params.name ?? '';
  const receiverTypeParam = recipientFromContext?.type ?? params.type ?? 'CLIENT';
  const avatarUrlParam = recipientFromContext?.avatarUrl ?? params.avatarUrl ?? '';

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<RbCoinsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => scrollToBottom()
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => scrollToBottom()
    );
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [scrollToBottom]);

  const receiverType = (recipientFromContext?.type ?? (String(receiverTypeParam ?? '').toUpperCase() === 'EMPLOYEE' ? 'EMPLOYEE' : 'CLIENT')) as 'CLIENT' | 'EMPLOYEE';

  const loadData = useCallback(async () => {
    if (!apiToken || !id) return;
    try {
      const [balanceRes, historyRes] = await Promise.all([
        getRbCoinsBalance(apiToken),
        getRbCoinsHistory(apiToken, { limit: 200 }),
      ]);
      setBalance(balanceRes.balance);
      const mutual = (historyRes.data || [])
        .filter((tx) => tx.otherParty?.id === id && tx.type === 'TRANSFER')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setTransactions(mutual);
    } catch {
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [apiToken, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => setTransferRecipient(null);
  }, [setTransferRecipient]);

  useEffect(() => {
    if (transactions.length > 0) scrollToBottom();
  }, [transactions.length, scrollToBottom]);

  const handleSend = async () => {
    const amount = parseFloat(sendAmount.replace(/\s/g, '').replace(',', '.'));
    if (!apiToken || !id || isNaN(amount) || amount <= 0) {
      Alert.alert(t('commonError') || 'Error', t('transferChatEnterValidAmount'));
      return;
    }
    if (amount > balance) {
      Alert.alert(t('commonError') || 'Error', t('transferChatNotEnoughRbc'));
      return;
    }
    setSending(true);
    try {
      await rbCoinsTransfer(apiToken, {
        amount,
        receiverId: id,
        receiverType,
        description: sendNote.trim() || undefined,
      });
      setSendAmount('');
      setSendNote('');
      await loadData();
    } catch (e) {
      Alert.alert(t('commonError') || 'Error', e instanceof Error ? e.message : t('transferChatFailed'));
    } finally {
      setSending(false);
    }
  };

  const amountNum = parseFloat(sendAmount.replace(/\s/g, '').replace(',', '.')) || 0;
  const isValid = amountNum > 0 && amountNum <= balance && !sending;

  const displayName = name || transactions[0]?.otherParty?.name || t('commonRecipient');
  const avatarSrc = transactions[0] ? recipientAvatarUrl(transactions[0]) : (avatarUrlParam && avatarUrlParam.trim() ? avatarUrlParam.trim() : undefined);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header
          showBackButton
          onBackPress={() => router.back()}
          middleComponent={<ThemedText className="text-lg font-semibold">{displayName}</ThemedText>}
          rightComponents={[<Avatar key="avatar" size="sm" src={avatarSrc} name={displayName} />]}
        />

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" />
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">{t('commonLoading')}</ThemedText>
            </View>
          ) : transactions.length === 0 ? (
            <View className="py-8 px-4">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
                {t('transferChatNoTransactions')}
              </ThemedText>
            </View>
          ) : (
            transactions.map((tx) => {
              const isSent = tx.direction === 'sent';
              const amount = Math.abs(tx.amount);
              const date = formatChatDate(tx.createdAt, t);
              return (
                <View
                  key={tx.id}
                  className={`flex-row mb-4 ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <View
                    style={isSent ? { backgroundColor: colors.highlight } : undefined}
                    className={`rounded-2xl px-4 py-2 max-w-[80%] ${!isSent ? 'bg-light-secondary dark:bg-dark-secondary' : ''}`}
                  >
                    <ThemedText className={`text-base font-semibold ${isSent ? 'text-white' : ''}`}>
                      {isSent ? '-' : '+'}
                      {formatBalance(amount)} RBC
                    </ThemedText>
                    {tx.description ? (
                      <ThemedText
                        className={`text-sm mt-0.5 ${isSent ? 'text-white/90' : 'text-light-subtext dark:text-dark-subtext'}`}
                      >
                        {tx.description}
                      </ThemedText>
                    ) : null}
                    <ThemedText
                      className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-light-subtext dark:text-dark-subtext'}`}
                    >
                      {date}
                    </ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View
          className="border-t border-light-secondary dark:border-dark-secondary bg-light-primary dark:bg-dark-primary p-global"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <TextInput
              placeholder={t('transferChatAmountPlaceholder')}
              placeholderTextColor="#888"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
              onFocus={() => setTimeout(scrollToBottom, 0)}
              className="flex-1 bg-light-secondary dark:bg-dark-secondary rounded-xl px-4 py-3 text-base text-light-text dark:text-dark-text"
            />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">RBC</ThemedText>
          </View>
          <TextInput
            placeholder={t('transferChatNoteOptional')}
            placeholderTextColor="#888"
            value={sendNote}
            onChangeText={setSendNote}
            onFocus={() => setTimeout(scrollToBottom, 0)}
            className="bg-light-secondary dark:bg-dark-secondary rounded-xl px-4 py-3 text-base text-light-text dark:text-dark-text mb-3"
          />
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
            {amountNum > 0
              ? `${t('transferChatBalance')}: ${formatBalance(balance)} RBC · ${t('transferChatRemaining')}: ${formatBalance(Math.max(0, balance - amountNum))} RBC`
              : `${t('transferChatBalance')}: ${formatBalance(balance)} RBC`}
          </ThemedText>
          <Button
            title={sending ? t('transferChatSending') : t('transferChatSend')}
            onPress={handleSend}
            disabled={!isValid}
            className="rounded-xl"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
