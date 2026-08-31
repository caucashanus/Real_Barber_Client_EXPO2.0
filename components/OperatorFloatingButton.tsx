import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { RbicekChatModal } from '@/components/rbicek/RbicekChatModal';
import { useTranslation } from '@/hooks/useTranslation';
import { useOperatorSupportAvailable } from '@/hooks/useOperatorSupportAvailable';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import { isRbicekEnabled } from '@/constants/rbicek';
import { useOperatorButtonEnabled } from '@/utils/operatorButtonPreference';
import { shouldHideCustomerAiWidget } from '@/utils/customerAiVisibility';
import { shadowPresets } from '@/utils/useShadow';

const OPERATOR_ICON = require('@/assets/img/operator.png');
const BUTTON_SIZE = 64;
const OFFSCREEN_LEFT = 28;

function operatorBottomOffset(): number {
  const { height } = Dimensions.get('window');
  return height * 0.35 - BUTTON_SIZE / 2;
}

export default function OperatorFloatingButton() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const sheetRef = useRef<ActionSheetRef>(null);
  const [rbicekOpen, setRbicekOpen] = useState(false);
  const rbicekEnabled = isRbicekEnabled();
  const isSupportAvailable = useOperatorSupportAvailable();
  const { enabled: isOperatorEnabled, isLoading: isOperatorPrefLoading } = useOperatorButtonEnabled();

  if (
    !isSupportAvailable ||
    isOperatorPrefLoading ||
    !isOperatorEnabled ||
    (rbicekEnabled && shouldHideCustomerAiWidget(pathname))
  ) {
    return null;
  }

  const openSupport = () => {
    if (rbicekEnabled) {
      setRbicekOpen(true);
      return;
    }
    sheetRef.current?.show();
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 z-50"
        style={{ bottom: 0, overflow: 'visible' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            rbicekEnabled ? t('customerAiFabAccessibility') : t('operatorFabAccessibility')
          }
          onPress={openSupport}
          className="absolute items-center justify-center active:opacity-90"
          style={{
            left: -OFFSCREEN_LEFT,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            bottom: operatorBottomOffset(),
            ...shadowPresets.large,
          }}>
          <Image
            source={OPERATOR_ICON}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2 }}
            contentFit="cover"
          />
        </Pressable>
      </View>

      {rbicekEnabled ? (
        <RbicekChatModal visible={rbicekOpen} onClose={() => setRbicekOpen(false)} />
      ) : (
        <OperatorSupportSheet ref={sheetRef} />
      )}
    </>
  );
}
