import React, { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { deleteClientAccount } from '@/api/client';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { apiToken, clearAuth } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSheetRef = useRef<ActionSheetRef>(null);

  const handleDeleteAccount = async (reason?: string) => {
    if (!apiToken || isDeleting) {
      Alert.alert('', t('settingsDeleteAccountNeedLogin'));
      return;
    }
    setIsDeleting(true);
    try {
      await deleteClientAccount(apiToken, reason);
      await clearAuth();
      router.replace('/screens/welcome');
    } catch (e) {
      Alert.alert(
        '',
        e instanceof Error && e.message ? e.message : t('settingsDeleteAccountError')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="px-4 pt-4 pb-6"
          title={t('settingsDeleteAccount')}
          subtitle={t('settingsDeleteAccountSectionDesc')}
        />

        <View className="px-4 pb-4">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
            {t('settingsDeleteAccountConfirmMessage')}
          </ThemedText>
        </View>

        <View className="px-4 pb-4 pt-2">
          <Button
            title={t('settingsDeleteAccountDetailsButton')}
            variant="secondary"
            rounded="full"
            size="large"
            className="mb-3"
            onPress={() => router.push('/screens/delete-account-details')}
          />
          <Button
            title={isDeleting ? t('settingsDeleteAccountDeleting') : t('settingsDeleteAccount')}
            variant="outline"
            rounded="full"
            size="large"
            className="border-red-500"
            textClassName="text-red-600 dark:text-red-400 font-semibold"
            loading={isDeleting}
            disabled={isDeleting}
            onPress={() => deleteSheetRef.current?.show()}
          />
        </View>
      </ThemedScroller>

      <ConfirmationModal
        actionSheetRef={deleteSheetRef}
        title={t('settingsDeleteAccountConfirmTitle')}
        message={t('settingsDeleteAccountConfirmMessage')}
        optionalReasonPlaceholder={t('settingsDeleteAccountReasonPlaceholder')}
        quickReasons={[
          t('settingsDeleteAccountReasonNoNeed'),
          t('settingsDeleteAccountReasonPrivacy'),
          t('settingsDeleteAccountReasonBranchService'),
          t('settingsDeleteAccountReasonAppButClient'),
          t('settingsDeleteAccountReasonOther'),
        ]}
        cancelText={t('settingsDeleteAccountCancel')}
        confirmText={t('settingsDeleteAccountConfirm')}
        onCancel={() => {}}
        onConfirm={(reason) => {
          void handleDeleteAccount(reason);
        }}
      />
    </View>
  );
}
