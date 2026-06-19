import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';

interface SignupEmailStepProps {
  email: string;
  emailError: string;
  apiError: string;
  emailDomainSuggestions: string[];
  onEmailChange: (value: string) => void;
  onEmailValidate: (value: string) => void;
}

export default function SignupEmailStep({
  email,
  emailError,
  apiError,
  emailDomainSuggestions,
  onEmailChange,
  onEmailValidate,
}: SignupEmailStepProps) {
  const { t } = useTranslation();

  const applyDomainSuggestion = (domain: string) => {
    const at = email.indexOf('@');
    const local = at >= 0 ? email.slice(0, at).trim() : email.trim();
    const next = `${local}@${domain}`;
    onEmailChange(next);
    if (emailError) onEmailValidate(next);
  };

  return (
    <View className="px-6 pb-8 pt-4">
      <ThemedText variant="h2">
        {t('signupStepEmailTitle')}
      </ThemedText>
      <ThemedText className="mb-6 mt-1 text-base text-light-subtext dark:text-dark-subtext">
        {t('signupStepEmailSubtitle')}
      </ThemedText>
      <Input
        label={t('signupEmail')}
        value={email}
        onChangeText={(text) => {
          onEmailChange(text);
          if (emailError) onEmailValidate(text);
        }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        containerClassName="mb-4"
      />
      {emailDomainSuggestions.length > 0 ? (
        <View className="mb-2">
          <ThemedText className="mb-2 text-xs text-light-subtext dark:text-dark-subtext">
            {t('signupEmailDomainHint')}
          </ThemedText>
          <View className="flex-row flex-wrap gap-2.5">
            {emailDomainSuggestions.map((domain) => (
              <Chip
                key={domain}
                label={domain}
                size="md"
                onPress={() => applyDomainSuggestion(domain)}
              />
            ))}
          </View>
        </View>
      ) : null}
      {apiError ? (
        <ThemedText className="mt-2 text-sm text-red-500 dark:text-red-400">{apiError}</ThemedText>
      ) : null}
    </View>
  );
}
