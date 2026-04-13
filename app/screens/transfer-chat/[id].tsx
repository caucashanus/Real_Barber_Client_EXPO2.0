import { useLocalSearchParams, useRouter } from 'expo-router';
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
  TouchableOpacity,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getRbCoinsBalance,
  getRbCoinsHistory,
  rbCoinsTransfer,
  type RbCoinsHistoryItem,
} from '@/api/rb-coins';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import {
  useTransferRecipient,
  useSetTransferRecipient,
} from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatChatDate(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 24)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
  const actionSheetRef = useRef<ActionSheetRef>(null);

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

  const receiverType = (recipientFromContext?.type ??
    (String(receiverTypeParam ?? '').toUpperCase() === 'EMPLOYEE' ? 'EMPLOYEE' : 'CLIENT')) as
    | 'CLIENT'
    | 'EMPLOYEE';

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
      Alert.alert(
        t('commonError') || 'Error',
        e instanceof Error ? e.message : t('transferChatFailed')
      );
    } finally {
      setSending(false);
    }
  };

  const amountNum = parseFloat(sendAmount.replace(/\s/g, '').replace(',', '.')) || 0;
  const isValid = amountNum > 0 && amountNum <= balance && !sending;

  const displayName = name || transactions[0]?.otherParty?.name || t('commonRecipient');
  const avatarSrc = transactions[0]
    ? recipientAvatarUrl(transactions[0])
    : avatarUrlParam && avatarUrlParam.trim()
      ? avatarUrlParam.trim()
      : undefined;

  const headerRight =
    receiverType === 'EMPLOYEE'
      ? [
          <Avatar key="avatar" size="sm" src={avatarSrc} name={displayName} />,
          <HeaderIcon
            key="menu"
            icon="MoreVertical"
            href="0"
            onPress={() => actionSheetRef.current?.show()}
          />,
        ]
      : [<Avatar key="avatar" size="sm" src={avatarSrc} name={displayName} />];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header
          showBackButton
          onBackPress={() => router.back()}
          middleComponent={<ThemedText className="text-lg font-semibold">{displayName}</ThemedText>}
          rightComponents={headerRight}
        />

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" />
              <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                {t('commonLoading')}
              </ThemedText>
            </View>
          ) : transactions.length === 0 ? (
            <View className="px-4 py-8">
              <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
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
                  className={`mb-4 flex-row ${isSent ? 'justify-end' : 'justify-start'}`}>
                  <View
                    style={isSent ? { backgroundColor: colors.highlight } : undefined}
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${!isSent ? 'bg-light-secondary dark:bg-dark-secondary' : ''}`}>
                    <ThemedText className={`text-base font-semibold ${isSent ? 'text-white' : ''}`}>
                      {isSent ? '-' : '+'}
                      {formatBalance(amount)} RBC
                    </ThemedText>
                    {tx.description ? (
                      <ThemedText
                        className={`mt-0.5 text-sm ${isSent ? 'text-white/90' : 'text-light-subtext dark:text-dark-subtext'}`}>
                        {tx.description}
                      </ThemedText>
                    ) : null}
                    <ThemedText
                      className={`mt-1 text-xs ${isSent ? 'text-white/70' : 'text-light-subtext dark:text-dark-subtext'}`}>
                      {date}
                    </ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View
          className="border-t border-light-secondary bg-light-primary p-global dark:border-dark-secondary dark:bg-dark-primary"
          style={{ paddingBottom: insets.bottom + 8 }}>
          <View className="mb-2 flex-row items-center gap-2">
            <TextInput
              placeholder={t('transferChatAmountPlaceholder')}
              placeholderTextColor="#888"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
              onFocus={() => setTimeout(scrollToBottom, 0)}
              className="flex-1 rounded-xl bg-light-secondary px-4 py-3 text-base text-light-text dark:bg-dark-secondary dark:text-dark-text"
            />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              RBC
            </ThemedText>
          </View>
          <TextInput
            placeholder={t('transferChatNoteOptional')}
            placeholderTextColor="#888"
            value={sendNote}
            onChangeText={setSendNote}
            onFocus={() => setTimeout(scrollToBottom, 0)}
            className="mb-3 rounded-xl bg-light-secondary px-4 py-3 text-base text-light-text dark:bg-dark-secondary dark:text-dark-text"
          />
          <ThemedText className="mb-2 text-xs text-light-subtext dark:text-dark-subtext">
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

        {receiverType === 'EMPLOYEE' ? (
          <ActionSheetThemed
            ref={actionSheetRef}
            gestureEnabled
            containerStyle={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}>
            <View className="p-4">
              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={() => {
                  actionSheetRef.current?.hide();
                  router.push(`/screens/barber-detail?id=${encodeURIComponent(id)}`);
                }}>
                <Icon name="User" size={20} className="mr-3" />
                <ThemedText>{t('transferChatMenuViewProfile')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ActionSheetThemed>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
