import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { Clipboard, Linking, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTheme } from '@/app/contexts/ThemeContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
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
    const [copied, setCopied] = useState(false);

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

    const handleCopyAddress = () => {
      const displayAddress = address?.trim() || '';
      if (!displayAddress) return;
      Clipboard.setString(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const displayAddress = address?.trim() || '';
    const trimmedBranchName = branchName?.trim() ?? '';
    const logoSource = isDark
      ? require('@/assets/img/wallet/realbarber-dark.png')
      : require('@/assets/img/wallet/realbarber-light.png');

    return (
      <ActionSheetThemed
        ref={setRef}
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

          {displayAddress ? (
            <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-light-secondary px-3 py-2.5 dark:bg-dark-secondary">
              <ThemedText
                className="min-w-0 flex-1 text-xs text-light-subtext dark:text-dark-subtext"
                numberOfLines={2}>
                {displayAddress}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copied ? t('barberShareCopied') : t('barberShareCopyLink')}
                onPress={handleCopyAddress}
                hitSlop={8}
                className="shrink-0 active:opacity-60">
                <Icon name={copied ? 'Check' : 'Copy'} size={16} className="opacity-80" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </ActionSheetThemed>
    );
  }
);
