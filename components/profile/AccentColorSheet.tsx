import Slider from '@react-native-community/slider';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useAccentColor } from '@/contexts/AccentColorContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { accentHexToHue, accentHueToHex } from '@/utils/accentColorHue';
import { triggerSelection } from '@/utils/appHaptics';

interface AccentColorSheetProps {
  onClose?: () => void;
}

export const AccentColorSheet = forwardRef<ActionSheetRef, AccentColorSheetProps>(
  function AccentColorSheet({ onClose }, ref) {
    const { t } = useTranslation();
    const { accentColor, setAccentColor } = useAccentColor();
    const colors = useThemeColors();
    const innerRef = useRef<ActionSheetRef | null>(null);
    const [hue, setHue] = useState(() => accentHexToHue(accentColor));
    const lastHapticStepRef = useRef<number | null>(null);

    const setRefs = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    useEffect(() => {
      setHue(accentHexToHue(accentColor));
    }, [accentColor]);

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const applyHue = (value: number) => {
      const step = Math.round(value / 6);
      if (lastHapticStepRef.current !== step) {
        lastHapticStepRef.current = step;
        triggerSelection();
      }

      setHue(value);
      setAccentColor(accentHueToHex(value));
    };

    return (
      <ActionSheetThemed ref={setRefs} gestureEnabled onClose={onClose}>
        <View className="px-4 pb-8 pt-3">
          <View className="relative mb-4 items-center justify-center">
            <ThemedText className="text-base font-semibold">{t('accentTitle')}</ThemedText>
            <Pressable
              onPress={hideSheet}
              hitSlop={12}
              accessibilityLabel={t('sheetClose')}
              className="absolute right-0 top-0 p-1">
              <Icon name="X" size={22} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>

          <ThemedText className="mb-4 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('accentExplanation')}
          </ThemedText>

          <View className="mb-5 h-20 flex-row items-center">
            <View
              className="h-20 w-20 overflow-hidden rounded-2xl"
              style={{ backgroundColor: accentColor }}
            />
            <View className="flex-1 justify-center pl-4">
              <ThemedText className="text-sm font-medium">{t('accentCurrentColor')}</ThemedText>
              <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                {accentColor}
              </ThemedText>
            </View>
          </View>

          <ThemedText className="mb-2 text-sm font-medium">{t('accentHueSlider')}</ThemedText>
          <Slider
            minimumValue={0}
            maximumValue={360}
            value={hue}
            onValueChange={applyHue}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor="#ccc"
            thumbTintColor={accentColor}
          />

          <ThemedText className="mb-2 mt-6 text-sm font-medium">{t('accentTabPreviewLabel')}</ThemedText>
          <View
            pointerEvents="none"
            style={{
              backgroundColor: colors.bg,
              borderTopColor: colors.secondary,
              borderTopWidth: 1,
            }}>
            <View className="flex-row items-stretch">
              <PreviewTabItem label={t('navHome')} icon="Home" focused={false} />
              <PreviewTabItem label={t('navBookings')} icon="CalendarPlus" focused />
              <PreviewTabItem label={t('navProfile')} icon="CircleUser" focused={false} />
            </View>
          </View>
        </View>
      </ActionSheetThemed>
    );
  }
);

function PreviewTabItem(props: {
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  focused: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 flex-col items-center justify-center pb-0 pt-4">
      <View className={props.focused ? 'opacity-100' : 'opacity-40'}>
        <Icon
          name={props.icon}
          size={26}
          strokeWidth={props.focused ? 2.1 : 1.7}
          color={props.focused ? colors.highlight : colors.icon}
        />
      </View>
      <ThemedText
        style={props.focused ? { color: colors.highlight } : undefined}
        className={`mt-px text-[9px] ${!props.focused ? 'text-neutral-500' : ''}`}>
        {props.label}
      </ThemedText>
    </View>
  );
}
