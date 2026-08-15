import React, { forwardRef, useCallback, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import ThemeAppearancePhonePreview from '@/components/profile/ThemeAppearancePhonePreview';
import ThemedText from '@/components/ThemedText';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { ThemePreference } from '@/constants/themeAppearance';

const OPTIONS: ThemePreference[] = ['system', 'dark', 'light'];

interface ThemeAppearanceSheetProps {
  onClose?: () => void;
}

export const ThemeAppearanceSheet = forwardRef<ActionSheetRef, ThemeAppearanceSheetProps>(
  function ThemeAppearanceSheet({ onClose }, ref) {
    const { t } = useTranslation();
    const { accentColor } = useAccentColor();
    const { preference, setThemePreference } = useTheme();
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

    const handleSelect = (next: ThemePreference) => {
      setThemePreference(next);
      hideSheet();
    };

    const labelFor = (option: ThemePreference) => {
      if (option === 'system') return t('appearanceOptionSystem');
      if (option === 'dark') return t('appearanceOptionDark');
      return t('appearanceOptionLight');
    };

    return (
      <ActionSheetThemed ref={setRefs} gestureEnabled onClose={onClose}>
        <View className="px-4 pb-8 pt-3">
          <View className="relative mb-6 items-center justify-center">
            <ThemedText className="text-base font-semibold">{t('appearanceSheetTitle')}</ThemedText>
            <Pressable
              onPress={hideSheet}
              hitSlop={12}
              accessibilityLabel={t('sheetClose')}
              className="absolute right-0 top-0 p-1">
              <Icon name="X" size={22} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>

          <View className="flex-row justify-between gap-2">
            {OPTIONS.map((option) => {
              const selected = preference === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => handleSelect(option)}
                  className="flex-1 items-center active:opacity-80">
                  <ThemeAppearancePhonePreview variant={option} />
                  <ThemedText className="mt-3 text-center text-xs font-medium">
                    {labelFor(option)}
                  </ThemedText>
                  <View className="mt-2 h-6 w-6 items-center justify-center">
                    {selected ? (
                      <View
                        className="h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: accentColor }}>
                        <Icon name="Check" size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View className="h-6 w-6 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ActionSheetThemed>
    );
  }
);
