import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';

import { changePassword } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';

export default function ChangePasswordScreen() {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('changePasswordErrorFillAll'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('changePasswordErrorMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePasswordErrorMismatch'));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t('changePasswordErrorSameAsCurrent'));
      return;
    }

    if (!apiToken) {
      setError(t('changePasswordErrorNotLoggedIn'));
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(apiToken, currentPassword, newPassword);
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.back(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('changePasswordErrorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary px-6 dark:bg-dark-primary">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Icon name="Check" size={40} color="#22c55e" />
          </View>
          <ThemedText className="mb-2 text-center text-xl font-semibold">
            {t('changePasswordSuccessTitle')}
          </ThemedText>
          <ThemedText className="text-center text-base text-light-subtext dark:text-dark-subtext">
            {t('changePasswordSuccessMessage')}
          </ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <Header showBackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-light-primary dark:bg-dark-primary">
        <ThemedScroller keyboardShouldPersistTaps="handled" className="flex-1">
          <Section title={t('changePasswordTitle')} titleSize="lg" className="mt-2 px-global">
            <Input
              label={t('changePasswordCurrent')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('changePasswordPlaceholderCurrent')}
              isPassword
              variant="classic"
              containerClassName="mb-4"
              editable={!isLoading}
            />
            <Input
              label={t('changePasswordNew')}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('changePasswordPlaceholderNew')}
              isPassword
              variant="classic"
              containerClassName="mb-1"
              editable={!isLoading}
            />
            <ThemedText className="mb-4 text-xs text-light-subtext dark:text-dark-subtext">
              {t('changePasswordHintMinLength')}
            </ThemedText>
            <Input
              label={t('changePasswordConfirmNew')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('changePasswordPlaceholderConfirm')}
              isPassword
              variant="classic"
              containerClassName="mb-4"
              editable={!isLoading}
            />
            {error ? (
              <ThemedText className="mb-4 text-center text-sm text-red-500 dark:text-red-400">
                {error}
              </ThemedText>
            ) : null}
            <Button
              title={t('changePasswordTitle')}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              className="mb-6"
            />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              <ThemedText className="font-semibold text-light-text dark:text-dark-text">
                {t('changePasswordTipLabel')}
              </ThemedText>{' '}
              {t('changePasswordTipText')}
            </ThemedText>
          </Section>
        </ThemedScroller>
      </KeyboardAvoidingView>
    </>
  );
}
