import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getClientMe, patchClientMe } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import { EditProfileSaveErrorSheet } from '@/components/profile/EditProfileSaveErrorSheet';
import SignupEmailStep from '@/components/signup/SignupEmailStep';
import { POST_LOGIN_HOME_PATH } from '@/utils/postLoginNavigation';
import { getEmailDomainChipSuggestions } from '@/utils/emailSuggestions';
import {
  getEditProfileSaveErrorPresentation,
  type EditProfileSaveErrorPresentation,
} from '@/utils/editProfileSaveError';
import {
  clientMeToCrm,
  emailRequiredValid,
  isClientMissingRequiredEmail,
} from '@/utils/signupHelpers';
import SiteLoadingState from '@/components/SiteLoadingState';

export default function LoginCompleteEmailScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { apiToken, token, client, setAuth, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const saveErrorSheetRef = useRef<ActionSheetRef>(null);
  const [saveErrorPresentation, setSaveErrorPresentation] =
    useState<EditProfileSaveErrorPresentation | null>(null);

  const emailDomainSuggestions = getEmailDomainChipSuggestions(email);

  useEffect(() => {
    if (isLoading) return;
    if (!apiToken) {
      router.replace('/screens/login');
      return;
    }
    if (client && !isClientMissingRequiredEmail(client)) {
      router.replace(POST_LOGIN_HOME_PATH);
    }
  }, [isLoading, apiToken, client]);

  const validateEmail = useCallback(
    (emailValue: string) => {
      const trimmed = emailValue.trim();
      if (!trimmed) {
        setEmailError(t('signupEmailRequired'));
        return false;
      }
      if (!emailRequiredValid(trimmed)) {
        setEmailError(t('signupEmailInvalid'));
        return false;
      }
      setEmailError('');
      return true;
    },
    [t]
  );

  const dismissSaveErrorSheet = useCallback(() => {
    saveErrorSheetRef.current?.hide();
  }, []);

  const presentSaveError = useCallback((err: unknown) => {
    setSaveErrorPresentation(getEditProfileSaveErrorPresentation(err));
    saveErrorSheetRef.current?.show();
  }, []);

  const handleContinue = async () => {
    setApiError('');
    if (!apiToken || !token) return;
    if (!validateEmail(email)) return;

    setSubmitting(true);
    try {
      await patchClientMe(apiToken, { email: email.trim() });
      const me = await getClientMe(apiToken);
      await setAuth(token, apiToken, clientMeToCrm(me));
      router.replace(POST_LOGIN_HOME_PATH);
    } catch (e) {
      presentSaveError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !apiToken) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <SiteLoadingState layout="page" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        style={{ paddingTop: insets.top }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <SignupEmailStep
            email={email}
            emailError={emailError}
            apiError={apiError}
            emailDomainSuggestions={emailDomainSuggestions}
            onEmailChange={setEmail}
            onEmailValidate={validateEmail}
          />
        </ScrollView>

        <View
          className="border-t border-light-secondary px-4 py-3 dark:border-dark-secondary"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <AppButton
            variant="default"
            size="lg"
            rounded="full"
            fullWidth
            title={t('multiStepNext')}
            loading={submitting}
            disabled={submitting}
            onPress={() => void handleContinue()}
            className="w-full"
            textClassName="text-white font-semibold"
            style={{ backgroundColor: colors.highlight }}
          />
        </View>
      </KeyboardAvoidingView>

      <EditProfileSaveErrorSheet
        ref={saveErrorSheetRef}
        presentation={saveErrorPresentation}
        onDismiss={dismissSaveErrorSheet}
      />
    </View>
  );
}
