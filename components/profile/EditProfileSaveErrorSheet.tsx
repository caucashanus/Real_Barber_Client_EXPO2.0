import { Image } from 'expo-image';
import React, { forwardRef, useCallback } from 'react';
import { Linking, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import ExpoBottomSheet from '@/components/sheets/ExpoBottomSheet';
import SheetContent, { useSheetTextWidth } from '@/components/sheets/SheetContent';
import {
  SHEET_ICON_SIZE,
  SHEET_ICON_STROKE,
  SHEET_TITLE_CLASS,
} from '@/components/sheets/expoSheetTheme';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import type { EditProfileSaveErrorPresentation } from '@/utils/editProfileSaveError';

const APP_TECH_SUPPORT_PHONE = '+420774522114';

interface EditProfileSaveErrorSheetProps {
  presentation: EditProfileSaveErrorPresentation | null;
  onDismiss: () => void;
}

export const EditProfileSaveErrorSheet = forwardRef<ActionSheetRef, EditProfileSaveErrorSheetProps>(
  function EditProfileSaveErrorSheet({ presentation, onDismiss }, ref) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const colors = useThemeColors();
    const titleWidth = useSheetTextWidth();

    const openTechSupportCall = useCallback(() => {
      void Linking.openURL(`tel:${APP_TECH_SUPPORT_PHONE}`).catch(() => {});
    }, []);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    return (
      <ExpoBottomSheet ref={setRef} onClose={onDismiss}>
        <SheetContent>
          <Image
            source={logoSource}
            style={{ height: 28, width: 32, marginBottom: 4, alignSelf: 'flex-start' }}
            contentFit="contain"
            contentPosition="left center"
            accessibilityLabel="Real Barber"
          />

          <ThemedText
            className={SHEET_TITLE_CLASS}
            style={{ width: titleWidth, maxWidth: titleWidth }}>
            {presentation ? t(presentation.titleKey) : ''}
          </ThemedText>
          <ThemedText
            className="text-sm leading-6 text-light-subtext dark:text-dark-subtext"
            style={{
              width: titleWidth,
              maxWidth: titleWidth,
              marginTop: 8,
            }}>
            {presentation ? t(presentation.bodyKey) : ''}
          </ThemedText>

          <View style={{ width: titleWidth, maxWidth: titleWidth, marginTop: 24 }}>
            <SheetNavRow
              label={t('editProfileSaveErrorSupport')}
              icon={
                <Icon
                  name="Phone"
                  size={SHEET_ICON_SIZE}
                  strokeWidth={SHEET_ICON_STROKE}
                  color={colors.text}
                />
              }
              onPress={openTechSupportCall}
            />
          </View>
        </SheetContent>
      </ExpoBottomSheet>
    );
  }
);
