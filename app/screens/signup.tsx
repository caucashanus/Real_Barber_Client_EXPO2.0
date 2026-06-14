import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useSignupFlow } from '@/app/hooks/useSignupFlow';
import MultiStep, { Step } from '@/components/MultiStep';
import SignupAvatarStep from '@/components/signup/SignupAvatarStep';
import SignupBirthdayStep from '@/components/signup/SignupBirthdayStep';
import SignupEmailStep from '@/components/signup/SignupEmailStep';
import SignupNameStep from '@/components/signup/SignupNameStep';
import SignupPhoneStep from '@/components/signup/SignupPhoneStep';

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
            <SignupPhoneStep
              countryCode={flow.countryCode}
              phone={flow.phone}
              phoneError={flow.phoneError}
              onCountryCodeChange={flow.setCountryCode}
              onPhoneChange={flow.setPhone}
              onPhoneValidate={flow.validatePhone}
            />
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
