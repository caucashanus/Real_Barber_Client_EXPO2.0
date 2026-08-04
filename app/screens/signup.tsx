import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useSignupFlow } from '@/app/hooks/useSignupFlow';
import MultiStep, { Step } from '@/components/MultiStep';
import ThemedText from '@/components/ThemedText';
import PhoneInput from '@/components/forms/PhoneInput';
import SignupAvatarStep from '@/components/signup/SignupAvatarStep';
import SignupBirthdayStep from '@/components/signup/SignupBirthdayStep';
import SignupEmailStep from '@/components/signup/SignupEmailStep';
import SignupNameStep from '@/components/signup/SignupNameStep';

export default function SignupScreen() {
  const flow = useSignupFlow();

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <MultiStep
        ref={flow.multiStepRef}
        onComplete={() => {
          flow.handleFinalizeSignup().catch(() => {});
        }}
        onClose={() => router.back()}
        isNextDisabled={flow.isNextDisabled}
        footerLoading={flow.submitting || flow.registerBusy}
        onBeforeNext={flow.onBeforeNext}
        onStepIndexChange={flow.handleStepIndexChange}
        showStepIndicator
        className="flex-1">
        <Step title={flow.t('signupStepNameTitle')}>
          <SignupNameStep
            firstName={flow.firstName}
            lastName={flow.lastName}
            onFirstNameChange={flow.setFirstName}
            onLastNameChange={flow.setLastName}
          />
        </Step>

        {!flow.phoneLockedFromLogin ? (
          <Step title={flow.t('signupStepPhoneTitle')}>
            <View className="px-6 pb-8 pt-4">
              <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
                {flow.t('signupStepPhoneTitle')}
              </ThemedText>
              <ThemedText className="mb-6 mt-1 text-base text-light-subtext dark:text-dark-subtext">
                {flow.t('signupStepPhoneSubtitle')}
              </ThemedText>
              <PhoneInput
                label={flow.t('signupPhoneLabel')}
                countryCode={flow.countryCode}
                onCountryCodeChange={flow.setCountryCode}
                phone={flow.phone}
                onPhoneChange={flow.setPhone}
                error={flow.phoneError}
                onValidate={(result) => {
                  if (result.valid) flow.setPhoneError('');
                  else if (result.errorKey) flow.setPhoneError(flow.t(result.errorKey));
                }}
              />
            </View>
          </Step>
        ) : null}

        <Step title={flow.t('signupStepEmailTitle')}>
          <SignupEmailStep
            email={flow.email}
            emailError={flow.emailError}
            apiError={flow.apiError}
            emailDomainSuggestions={flow.emailDomainSuggestions}
            onEmailChange={flow.setEmail}
            onEmailValidate={flow.validateEmail}
          />
        </Step>

        <Step title={flow.t('signupStepBirthdayTitle')} optional optionalSkipInHeader={false}>
          <SignupBirthdayStep
            birthday={flow.birthday}
            minBirthDate={flow.minBirthDate}
            maxBirthDate={flow.maxBirthDate}
            apiError={flow.apiError}
            onBirthdayChange={flow.setBirthday}
            onSkip={() => flow.multiStepRef.current?.skipOptionalStep()}
          />
        </Step>

        <Step title={flow.t('signupStepAvatarTitle')}>
          <SignupAvatarStep
            avatarChoice={flow.avatarChoice}
            apiError={flow.apiError}
            onAvatarChange={flow.setAvatarChoice}
          />
        </Step>
      </MultiStep>
    </View>
  );
}
