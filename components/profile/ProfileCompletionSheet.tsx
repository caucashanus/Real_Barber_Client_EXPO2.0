import { router } from 'expo-router';
import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import {
  editProfileHrefForStep,
  PROFILE_COMPLETION_STEP_CONFIG,
  type ProfileCompletionStepId,
} from '@/constants/profileCompletionSchema';
import { useTranslation } from '@/hooks/useTranslation';
import { dismissProfileCompletionStep } from '@/utils/profileCompletionPolicy';

interface ProfileCompletionSheetProps {
  step: ProfileCompletionStepId | null;
  onClose: () => void;
}

export const ProfileCompletionSheet = forwardRef<ActionSheetRef, ProfileCompletionSheetProps>(
  function ProfileCompletionSheet({ step, onClose }, ref) {
    const { t } = useTranslation();
    const innerRef = useRef<ActionSheetRef | null>(null);
    const didCompleteRef = useRef(false);

    const setRefs = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const handleComplete = () => {
      if (!step) return;
      didCompleteRef.current = true;
      hideSheet();
      onClose();
      router.push(editProfileHrefForStep(step) as never);
    };

    const handleSheetClose = () => {
      if (didCompleteRef.current) {
        didCompleteRef.current = false;
        return;
      }
      if (!step) return;
      void dismissProfileCompletionStep(step);
      onClose();
    };

    const config = step ? PROFILE_COMPLETION_STEP_CONFIG[step] : null;

    return (
      <ActionSheetThemed ref={setRefs} gestureEnabled onClose={handleSheetClose}>
        <View className="p-5 pb-7">
          {config ? (
            <>
              <ThemedText className="text-lg font-semibold">{t(config.titleKey)}</ThemedText>
              <ThemedText className="mb-5 mt-3 text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                {t(config.bodyKey)}
              </ThemedText>
              <View className="gap-2">
                <AppButton title={t('profileCompletionCta')} onPress={handleComplete} />
              </View>
            </>
          ) : null}
        </View>
      </ActionSheetThemed>
    );
  }
);
