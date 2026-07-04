import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/app/hooks/useTranslation';
import { useOperatorSupportAvailable } from '@/app/hooks/useOperatorSupportAvailable';
import LiveIndicator from '@/components/LiveIndicator';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import { useOperatorButtonEnabled } from '@/utils/operatorButtonPreference';
import { shadowPresets } from '@/utils/useShadow';

const OPERATOR_ICON = require('@/assets/img/operator.png');
const BUTTON_SIZE = 64;
/** Kolik px tlačítka schováme za levou hranu (jen část avataru kouká dovnitř). */
const OFFSCREEN_LEFT = 28;

/** Vertikální střed tlačítka — 35 % výšky obrazovky od spoda. */
function operatorBottomOffset(): number {
  const { height } = Dimensions.get('window');
  return height * 0.35 - BUTTON_SIZE / 2;
}

export default function OperatorFloatingButton() {
  const { t } = useTranslation();
  const sheetRef = useRef<ActionSheetRef>(null);
  const isSupportAvailable = useOperatorSupportAvailable();
  const { enabled: isOperatorEnabled, isLoading: isOperatorPrefLoading } = useOperatorButtonEnabled();

  if (!isSupportAvailable || isOperatorPrefLoading || !isOperatorEnabled) return null;

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 z-50"
        style={{ bottom: 0, overflow: 'visible' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('operatorFabAccessibility')}
          onPress={() => sheetRef.current?.show()}
          className="absolute items-center justify-center active:opacity-90"
          style={{
            left: -OFFSCREEN_LEFT,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            bottom: operatorBottomOffset(),
            ...shadowPresets.large,
          }}>
          <View className="relative">
            <Image
              source={OPERATOR_ICON}
              style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2 }}
              contentFit="cover"
            />
            <View className="absolute bottom-1 right-1.5 rounded-full border-2 border-light-primary dark:border-dark-primary">
              <LiveIndicator size="sm" />
            </View>
          </View>
        </Pressable>
      </View>
      <OperatorSupportSheet ref={sheetRef} />
    </>
  );
}
