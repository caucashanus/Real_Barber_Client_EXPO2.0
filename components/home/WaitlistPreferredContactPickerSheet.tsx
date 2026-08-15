import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import {
  WAITLIST_PREFERRED_CONTACT_ORDER,
  type WaitlistContactPickerSelection,
  type WaitlistPreferredContact,
} from '@/lib/waitlist/preferredContact';

const NESTED_SHEET_Z_INDEX = 10000;
const NESTED_SHEET_ELEVATION = 24;
const BRAND_WHATSAPP = '#25D366';
const BRAND_TELEGRAM = '#229ED9';

export type WaitlistPreferredContactPickerHandle = {
  show: () => void;
  hide: () => void;
};

interface WaitlistPreferredContactPickerSheetProps {
  nested?: boolean;
  profilePhone: string;
  profileEmail: string;
  onSelect: (selection: WaitlistContactPickerSelection) => void;
  t: (key: TranslationKey) => string;
}

export function preferredContactLabelKey(contact: WaitlistPreferredContact): TranslationKey {
  switch (contact) {
    case 'phone':
      return 'homeTodayTeamWaitlistPreferredPhone';
    case 'sms':
      return 'homeTodayTeamWaitlistPreferredSms';
    case 'whatsapp':
      return 'homeTodayTeamWaitlistPreferredWhatsapp';
    case 'telegram':
      return 'homeTodayTeamWaitlistPreferredTelegram';
    case 'email':
      return 'homeTodayTeamWaitlistPreferredEmail';
  }
}

export function preferredContactIcon(
  contact: WaitlistPreferredContact,
  colors: ReturnType<typeof useThemeColors>,
  size = 20
) {
  switch (contact) {
    case 'phone':
      return <Icon name="Phone" size={size} strokeWidth={2} color={colors.text} />;
    case 'sms':
      return <Icon name="MessageSquare" size={size} strokeWidth={2} color={colors.text} />;
    case 'whatsapp':
      return (
        <Icon
          name="MessageCircle"
          size={size}
          strokeWidth={2}
          color={BRAND_WHATSAPP}
          fill={BRAND_WHATSAPP}
        />
      );
    case 'telegram':
      return (
        <Icon name="Send" size={size} strokeWidth={2} color={BRAND_TELEGRAM} fill={BRAND_TELEGRAM} />
      );
    case 'email':
      return <Icon name="Mail" size={size} strokeWidth={2} color={colors.text} />;
  }
}

function pickerRowDetail(
  contact: WaitlistPreferredContact,
  profilePhone: string,
  profileEmail: string,
  t: (key: TranslationKey) => string
): { detail?: string; detailMuted?: boolean } {
  if (contact === 'phone') {
    return { detail: profilePhone };
  }
  if (contact === 'email') {
    if (profileEmail) return { detail: profileEmail };
    return {
      detail: t('homeTodayTeamWaitlistPreferredEmailPlaceholder'),
      detailMuted: true,
    };
  }
  return {};
}

const WaitlistPreferredContactPickerSheet = forwardRef<
  WaitlistPreferredContactPickerHandle,
  WaitlistPreferredContactPickerSheetProps
>(({ nested = true, profilePhone, profileEmail, onSelect, t }, ref) => {
  const colors = useThemeColors();
  const sheetRef = useRef<ActionSheetRef>(null);

  useImperativeHandle(ref, () => ({
    show: () => sheetRef.current?.show(),
    hide: () => sheetRef.current?.hide(),
  }));

  const selectAndClose = (selection: WaitlistContactPickerSelection) => {
    onSelect(selection);
    sheetRef.current?.hide();
  };

  return (
    <ActionSheetThemed
      ref={sheetRef}
      gestureEnabled
      isModal={!nested}
      zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}
      elevation={nested ? NESTED_SHEET_ELEVATION : undefined}
      defaultOverlayOpacity={nested ? 0.45 : undefined}>
      <View className="gap-1 px-4 pb-8 pt-2">
        <ThemedText className="mb-2 text-base font-semibold">
          {t('homeTodayTeamWaitlistPreferredPickerTitle')}
        </ThemedText>
        {WAITLIST_PREFERRED_CONTACT_ORDER.map((contact) => {
          const { detail, detailMuted } = pickerRowDetail(contact, profilePhone, profileEmail, t);
          return (
            <SheetNavRow
              key={contact}
              label={t(preferredContactLabelKey(contact))}
              detail={detail}
              detailMuted={detailMuted}
              icon={preferredContactIcon(contact, colors)}
              onPress={() => selectAndClose({ type: 'channel', contact })}
            />
          );
        })}
        <SheetNavRow
          label={t('homeTodayTeamWaitlistUseOtherContact')}
          icon={<Icon name="Contact" size={20} strokeWidth={2} color={colors.text} />}
          onPress={() => selectAndClose({ type: 'alternate' })}
        />
      </View>
    </ActionSheetThemed>
  );
});

WaitlistPreferredContactPickerSheet.displayName = 'WaitlistPreferredContactPickerSheet';

export default WaitlistPreferredContactPickerSheet;
