import React, { forwardRef, useCallback, useRef } from 'react';
import { Clipboard, Linking, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

export interface BranchNavigateSheetProps {
  branchName?: string | null;
  address?: string | null;
}

/** Adresa nebo název pobočky pro vyhledání v mapách (stejně jako HomeSpotlightCard). */
export function getBranchNavigateMapsQuery(
  branchName?: string | null,
  address?: string | null
): string {
  return (address?.trim() || branchName?.trim() || '').trim();
}

export const BranchNavigateSheet = forwardRef<ActionSheetRef, BranchNavigateSheetProps>(
  function BranchNavigateSheet({ branchName, address }, ref) {
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

    const openMaps = (app: 'google' | 'waze') => {
      innerRef.current?.hide();
      const q = encodeURIComponent(getBranchNavigateMapsQuery(branchName, address));
      setTimeout(() => {
        if (app === 'google') {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
        } else {
          Linking.openURL(`https://waze.com/ul?q=${q}&navigate=yes`);
        }
      }, 300);
    };

    const displayAddress = address?.trim() || '';

    return (
      <ActionSheetThemed ref={setRef} gestureEnabled>
        <View className="gap-3 px-4 pb-8 pt-2">
          <ThemedText className="mb-1 text-center text-base font-semibold">
            {t('branchNavigateSheetHeading')}
            {branchName?.trim() ? ` ${branchName.trim()}` : ''}
          </ThemedText>
          {displayAddress ? (
            <Pressable
              onPress={() => Clipboard.setString(displayAddress)}
              className="-mt-1 flex-row items-center justify-center gap-1 active:opacity-60">
              <ThemedText className="text-center text-xs text-light-subtext dark:text-dark-subtext">
                {displayAddress}
              </ThemedText>
              <Icon name="Copy" size={12} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          ) : null}
          <Button
            title={t('kudyOpenGoogleMaps')}
            onPress={() => openMaps('google')}
            variant="primary"
            iconStart="Map"
            style={{ backgroundColor: '#34A853' }}
          />
          <Button
            title={t('kudyOpenWaze')}
            onPress={() => openMaps('waze')}
            variant="primary"
            iconStart="Navigation"
            style={{ backgroundColor: '#33CCFF' }}
          />
        </View>
      </ActionSheetThemed>
    );
  }
);
