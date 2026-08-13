import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import OperatorContactChannels from '@/components/OperatorContactChannels';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

export const ProfilePhoneContactSheet = forwardRef<ActionSheetRef>(
  function ProfilePhoneContactSheet(_props, ref) {
    const { t } = useTranslation();
    const innerRef = useRef<ActionSheetRef | null>(null);

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

    return (
      <ActionSheetThemed ref={setRefs} gestureEnabled>
        <View className="gap-1 px-4 pb-8 pt-2">
          <ThemedText className="mb-2 text-base font-semibold">{t('profileContactsPhone')}</ThemedText>
          <OperatorContactChannels onBeforeOpen={hideSheet} />
        </View>
      </ActionSheetThemed>
    );
  }
);
