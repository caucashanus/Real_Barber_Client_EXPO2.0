import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { homeFastBookWhenPanelBg } from '@/components/home/fast-book/homeFastBookSheetUi';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import {
  ActionSheetNestedDock,
  ActionSheetStackScrim,
} from '@/components/shared/sheet/ActionSheetNestedDock';
import {
  preferredContactIcon,
  preferredContactLabelKey,
} from '@/components/shared/preferred-contact/preferredContactChannelUi';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import {
  WAITLIST_PREFERRED_CONTACT_ORDER,
  type WaitlistContactPickerSelection,
  type WaitlistPreferredContact,
} from '@/lib/waitlist/preferredContact';

export { preferredContactIcon, preferredContactLabelKey };

export type WaitlistPreferredContactPickerHandle = {
  show: () => void;
  hide: () => void;
};

interface WaitlistPreferredContactPickerSheetProps {
  nested?: boolean;
  /** Vnořený režim: poloprůhledný scrim nad rodičem (default). Kids watch: false. */
  nestedStackScrim?: boolean;
  profilePhone: string;
  profileEmail: string;
  onSelect: (selection: WaitlistContactPickerSelection) => void;
  onOpenChange?: (open: boolean) => void;
  t: (key: TranslationKey) => string;
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

function PreferredContactPickerPanel({
  profilePhone,
  profileEmail,
  onSelect,
  t,
}: Pick<
  WaitlistPreferredContactPickerSheetProps,
  'profilePhone' | 'profileEmail' | 'onSelect' | 't'
>) {
  const colors = useThemeColors();

  return (
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
            onPress={() => onSelect({ type: 'channel', contact })}
          />
        );
      })}
      <SheetNavRow
        label={t('homeTodayTeamWaitlistUseOtherContact')}
        icon={<Icon name="Contact" size={20} strokeWidth={2} color={colors.text} />}
        onPress={() => onSelect({ type: 'alternate' })}
      />
    </View>
  );
}

const WaitlistPreferredContactPickerSheet = forwardRef<
  WaitlistPreferredContactPickerHandle,
  WaitlistPreferredContactPickerSheetProps
>(({ nested = true, nestedStackScrim = true, profilePhone, profileEmail, onSelect, onOpenChange, t }, ref) => {
  const colors = useThemeColors();
  const sheetRef = useRef<ActionSheetRef>(null);
  const [nestedOpen, setNestedOpen] = useState(false);

  const setOpen = useCallback(
    (open: boolean) => {
      setNestedOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  useImperativeHandle(ref, () => ({
    show: () => {
      if (nested) setOpen(true);
      else sheetRef.current?.show();
    },
    hide: () => {
      if (nested) setOpen(false);
      else sheetRef.current?.hide();
    },
  }));

  const dismissNested = useCallback(() => setOpen(false), [setOpen]);

  const selectAndClose = (selection: WaitlistContactPickerSelection) => {
    onSelect(selection);
    if (nested) dismissNested();
    else sheetRef.current?.hide();
  };

  if (nested) {
    if (!nestedOpen) return null;
    return (
      <>
        {nestedStackScrim ? <ActionSheetStackScrim onDismiss={dismissNested} /> : null}
        <ActionSheetNestedDock
          panelBackgroundColor={homeFastBookWhenPanelBg(colors.isDark)}
          onDismiss={dismissNested}>
          <PreferredContactPickerPanel
            profilePhone={profilePhone}
            profileEmail={profileEmail}
            onSelect={selectAndClose}
            t={t}
          />
        </ActionSheetNestedDock>
      </>
    );
  }

  return (
    <ActionSheetThemed ref={sheetRef} gestureEnabled isModal>
      <PreferredContactPickerPanel
        profilePhone={profilePhone}
        profileEmail={profileEmail}
        onSelect={selectAndClose}
        t={t}
      />
    </ActionSheetThemed>
  );
});

WaitlistPreferredContactPickerSheet.displayName = 'WaitlistPreferredContactPickerSheet';

export default WaitlistPreferredContactPickerSheet;
