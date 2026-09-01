import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useRef } from 'react';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import BranchAddress from '@/components/shared/BranchAddress';
import ExpoBottomSheet from '@/components/sheets/ExpoBottomSheet';
import SheetContent from '@/components/sheets/SheetContent';
import { SHEET_ICON_SIZE, SHEET_ICON_STROKE, SHEET_TITLE_CLASS } from '@/components/sheets/expoSheetTheme';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import {
  BRANCH_NAVIGATE_OPEN_DELAY_MS,
  openBranchGoogleMaps,
  openBranchWaze,
} from '@/utils/branchNavigationUrls';

export { getBranchNavigateMapsQuery } from '@/utils/branchNavigationUrls';

export interface BranchNavigateSheetProps {
  branchName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  nested?: boolean;
}

const BRAND_GOOGLE_MAPS = '#34A853';
const BRAND_WAZE = '#33CCFF';

export const BranchNavigateSheet = forwardRef<ActionSheetRef, BranchNavigateSheetProps>(
  function BranchNavigateSheet({ branchName, address, latitude, longitude, nested: _nested = false }, ref) {
    const innerRef = useRef<ActionSheetRef>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const { t } = useTranslation();
    const { isDark } = useTheme();
    const trimmedBranchName = branchName?.trim() ?? '';
    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    const openMaps = (app: 'google' | 'waze') => {
      innerRef.current?.hide();
      if (app === 'google') {
        openBranchGoogleMaps(branchName, address, latitude, longitude, BRANCH_NAVIGATE_OPEN_DELAY_MS);
        return;
      }
      openBranchWaze(branchName, address, latitude, longitude, BRANCH_NAVIGATE_OPEN_DELAY_MS);
    };

    return (
      <ExpoBottomSheet ref={setRef}>
        <SheetContent>
          <Image
            source={logoSource}
            style={{ height: 28, width: 32, marginBottom: 4, alignSelf: 'flex-start' }}
            contentFit="contain"
            contentPosition="left center"
            accessibilityLabel="Real Barber"
          />

          <ThemedText className={SHEET_TITLE_CLASS}>
            {t('branchNavigateSheetHeading')}
            {trimmedBranchName ? ` ${trimmedBranchName}` : ''}
          </ThemedText>

          <SheetNavRow
            label={t('kudyOpenGoogleMaps')}
            icon={
              <Icon
                name="MapPin"
                size={SHEET_ICON_SIZE}
                strokeWidth={SHEET_ICON_STROKE}
                color={BRAND_GOOGLE_MAPS}
                fill={BRAND_GOOGLE_MAPS}
              />
            }
            onPress={() => openMaps('google')}
          />
          <SheetNavRow
            label={t('kudyOpenWaze')}
            icon={
              <Icon
                name="Navigation"
                size={SHEET_ICON_SIZE}
                strokeWidth={SHEET_ICON_STROKE}
                color={BRAND_WAZE}
                fill={BRAND_WAZE}
              />
            }
            onPress={() => openMaps('waze')}
          />

          <BranchAddress address={address} className="mt-3" numberOfLines={2} />
        </SheetContent>
      </ExpoBottomSheet>
    );
  }
);

/** Alias — render uvnitř parent draweru (nearest branch). */
export const BranchNavigateNestedSheet = BranchNavigateSheet;
