import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useRef } from 'react';
import { Linking, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import BranchAddress from '@/components/shared/BranchAddress';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';

export interface BranchNavigateSheetProps {
  branchName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Render inside another action sheet (non-modal overlay above parent). */
  nested?: boolean;
}

const NAVIGATE_SHEET_ELEVATION = 24;
const NESTED_SHEET_Z_INDEX = 10000;
const BRAND_GOOGLE_MAPS = '#34A853';
const BRAND_WAZE = '#33CCFF';
const NAVIGATE_OPEN_DELAY_MS = 300;

/** Adresa nebo název pobočky pro vyhledání v mapách (stejně jako HomeSpotlightCard). */
export function getBranchNavigateMapsQuery(
  branchName?: string | null,
  address?: string | null
): string {
  return (address?.trim() || branchName?.trim() || '').trim();
}

function buildGoogleMapsUrl(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
): string {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  const q = encodeURIComponent(getBranchNavigateMapsQuery(branchName, address));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function buildWazeUrl(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
): string {
  if (latitude != null && longitude != null) {
    return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  }
  const q = encodeURIComponent(getBranchNavigateMapsQuery(branchName, address));
  return `https://waze.com/ul?q=${q}&navigate=yes`;
}

export const BranchNavigateSheet = forwardRef<ActionSheetRef, BranchNavigateSheetProps>(
  function BranchNavigateSheet({ branchName, address, latitude, longitude, nested = false }, ref) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
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

    const openMaps = (app: 'google' | 'waze') => {
      hideSheet();
      const url =
        app === 'google'
          ? buildGoogleMapsUrl(branchName, address, latitude, longitude)
          : buildWazeUrl(branchName, address, latitude, longitude);
      setTimeout(() => {
        void Linking.openURL(url).catch(() => {});
      }, NAVIGATE_OPEN_DELAY_MS);
    };

    const trimmedBranchName = branchName?.trim() ?? '';
    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    return (
      <ActionSheetThemed
        ref={setRef}
        fitContent
        gestureEnabled
        isModal={!nested}
        zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}
        elevation={NAVIGATE_SHEET_ELEVATION}
        defaultOverlayOpacity={0.45}>
        <View className="gap-1 px-4 pb-8 pt-2">
          <Image
            source={logoSource}
            style={{ height: 28, width: 32, marginBottom: 4, alignSelf: 'flex-start' }}
            contentFit="contain"
            contentPosition="left center"
            accessibilityLabel="Real Barber"
          />

          <ThemedText className="mb-2 text-base font-semibold leading-6">
            {t('branchNavigateSheetHeading')}
            {trimmedBranchName ? ` ${trimmedBranchName}` : ''}
          </ThemedText>

          <SheetNavRow
            label={t('kudyOpenGoogleMaps')}
            icon={
              <Icon
                name="MapPin"
                size={20}
                strokeWidth={2}
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
                size={20}
                strokeWidth={2}
                color={BRAND_WAZE}
                fill={BRAND_WAZE}
              />
            }
            onPress={() => openMaps('waze')}
          />

          <BranchAddress address={address} className="mt-3" numberOfLines={2} />
        </View>
      </ActionSheetThemed>
    );
  }
);
