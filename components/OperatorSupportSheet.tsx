import { router } from 'expo-router';
import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import {
  openOperatorPhone,
  openOperatorTelegram,
  openOperatorWhatsApp,
} from '@/utils/operatorContact';

export const OperatorSupportSheet = forwardRef<ActionSheetRef>(function OperatorSupportSheet(_, ref) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const innerRef = useRef<ActionSheetRef | null>(null);

  const setRef = useCallback(
    (node: ActionSheetRef | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
    },
    [ref]
  );

  const runContactAction = (action: () => Promise<void>) => {
    innerRef.current?.hide();
    setTimeout(() => {
      void action().catch(() => {});
    }, 300);
  };

  const openFeatureSettings = () => {
    innerRef.current?.hide();
    setTimeout(() => {
      router.push('/screens/feature-settings');
    }, 300);
  };

  return (
    <ActionSheetThemed ref={setRef} gestureEnabled>
      <View className="gap-3 px-4 pb-8 pt-2">
        <ThemedText className="mb-1 text-center text-base font-semibold">
          {t('operatorSheetTitle')}
        </ThemedText>
        <View className="mb-1 gap-1">
          <ThemedText className="text-center text-sm leading-5 text-light-subtext dark:text-dark-subtext">
            {t('operatorSheetIntro')}
          </ThemedText>
          <ThemedText className="text-center text-sm leading-5 text-light-subtext dark:text-dark-subtext">
            {t('operatorSheetDisableBefore')}
            <ThemedText
              className="text-sm font-medium underline"
              style={{ color: colors.highlight }}
              onPress={openFeatureSettings}>
              {t('operatorSheetDisableLink')}
            </ThemedText>
            .
          </ThemedText>
        </View>
        <AppButton
          title={t('operatorContactPhone')}
          onPress={() => runContactAction(openOperatorPhone)}
          variant="default"
          iconStart="Phone"
        />
        <AppButton
          title={t('operatorContactWhatsApp')}
          onPress={() => runContactAction(openOperatorWhatsApp)}
          variant="default"
          iconStart="MessageCircle"
          style={{ backgroundColor: '#25D366' }}
        />
        <AppButton
          title={t('operatorContactTelegram')}
          onPress={() => runContactAction(openOperatorTelegram)}
          variant="default"
          iconStart="Send"
          style={{ backgroundColor: '#229ED9' }}
        />
      </View>
    </ActionSheetThemed>
  );
});
