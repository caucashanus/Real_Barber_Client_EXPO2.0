import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import {
  openOperatorPhone,
  openOperatorTelegram,
  openOperatorWhatsApp,
} from '@/utils/operatorContact';

export const OperatorSupportSheet = forwardRef<ActionSheetRef>(function OperatorSupportSheet(_, ref) {
  const { t } = useTranslation();
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

  return (
    <ActionSheetThemed ref={setRef} gestureEnabled>
      <View className="gap-3 px-4 pb-8 pt-2">
        <ThemedText className="mb-1 text-center text-base font-semibold">
          {t('operatorSheetTitle')}
        </ThemedText>
        <Button
          title={t('operatorContactPhone')}
          onPress={() => runContactAction(openOperatorPhone)}
          variant="primary"
          iconStart="Phone"
        />
        <Button
          title={t('operatorContactWhatsApp')}
          onPress={() => runContactAction(openOperatorWhatsApp)}
          variant="primary"
          iconStart="MessageCircle"
          style={{ backgroundColor: '#25D366' }}
        />
        <Button
          title={t('operatorContactTelegram')}
          onPress={() => runContactAction(openOperatorTelegram)}
          variant="primary"
          iconStart="Send"
          style={{ backgroundColor: '#229ED9' }}
        />
      </View>
    </ActionSheetThemed>
  );
});
