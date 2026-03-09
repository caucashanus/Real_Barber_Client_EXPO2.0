import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useAuth } from '@/app/contexts/AuthContext';
import { changePassword } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';

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
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    if (!apiToken) {
      setError('You must be logged in.');
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
      setError(e instanceof Error ? e.message : 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center px-6 bg-light-primary dark:bg-dark-primary">
          <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-6">
            <Icon name="Check" size={40} color="#22c55e" />
          </View>
          <ThemedText className="text-xl font-semibold text-center mb-2">Password changed</ThemedText>
          <ThemedText className="text-base text-light-subtext dark:text-dark-subtext text-center">
            Your password has been changed successfully. You can now use your new password to sign in.
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
        className="flex-1 bg-light-primary dark:bg-dark-primary"
      >
        <ThemedScroller keyboardShouldPersistTaps="handled" className="flex-1">
          <Section title={t('changePasswordTitle')} titleSize="lg" className="mt-2 px-global">
            <Input
              label={t('changePasswordCurrent')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              isPassword
              variant="classic"
              containerClassName="mb-4"
              editable={!isLoading}
            />
            <Input
              label={t('changePasswordNew')}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min. 6 characters)"
              isPassword
              variant="classic"
              containerClassName="mb-1"
              editable={!isLoading}
            />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-4">
              Password must be at least 6 characters.
            </ThemedText>
            <Input
              label={t('changePasswordConfirmNew')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter new password again"
              isPassword
              variant="classic"
              containerClassName="mb-4"
              editable={!isLoading}
            />
            {error ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-4 text-center">{error}</ThemedText>
            ) : null}
            <Button
              title={t('changePasswordTitle')}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              className="mb-6"
            />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              <ThemedText className="font-semibold text-light-text dark:text-dark-text">Tip:</ThemedText> Use a
              strong password with letters, numbers and special characters.
            </ThemedText>
          </Section>
        </ThemedScroller>
      </KeyboardAvoidingView>
    </>
  );
}
