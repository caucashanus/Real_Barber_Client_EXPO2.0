import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Linking, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import CopyIconButton from '@/components/shared/CopyIconButton';
import SheetNavRow from '@/components/shared/SheetNavRow';
import { FacebookShareIcon } from '@/components/shared/ShareChannelIcons';
import ThemedText from '@/components/ThemedText';
import {
  buildProfileShareLinks,
  SHARE_OPEN_DELAY_MS,
} from '@/utils/profileShareLinks';

export interface ProfileShareSheetProps {
  displayName: string;
  shareUrl: string;
  title: string;
  emailSubject: string;
  emailBody: string;
  /** Render inside another action sheet (non-modal overlay above parent). */
  nested?: boolean;
}

const NESTED_SHEET_Z_INDEX = 10000;

export const ProfileShareSheet = forwardRef<ActionSheetRef, ProfileShareSheetProps>(
  function ProfileShareSheet(
    { displayName, shareUrl, title, emailSubject, emailBody, nested = false },
    ref
  ) {
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

    const links = useMemo(
      () => buildProfileShareLinks(shareUrl, displayName, emailSubject, emailBody),
      [displayName, emailBody, emailSubject, shareUrl]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const openLink = (url: string) => {
      hideSheet();
      setTimeout(() => {
        void Linking.openURL(url).catch(() => {});
      }, SHARE_OPEN_DELAY_MS);
    };

    return (
      <ActionSheetThemed
        ref={setRef}
        gestureEnabled
        isModal={!nested}
        zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}>
        <View className="gap-1 px-4 pb-8 pt-2">
          <ThemedText className="mb-2 text-base font-semibold">{title}</ThemedText>

          <SheetNavRow
            label={t('barberShareFacebook')}
            icon={<FacebookShareIcon size={20} />}
            onPress={() => openLink(links.facebook)}
          />
          <SheetNavRow
            label={t('barberShareTelegram')}
            icon={
              <Icon name="Send" size={20} strokeWidth={2} color="#229ED9" fill="#229ED9" />
            }
            onPress={() => openLink(links.telegram)}
          />
          <SheetNavRow
            label={t('barberShareWhatsApp')}
            icon={
              <Icon
                name="MessageCircle"
                size={20}
                strokeWidth={2}
                color="#25D366"
                fill="#25D366"
              />
            }
            onPress={() => openLink(links.whatsapp)}
          />
          <SheetNavRow
            label={t('barberShareEmail')}
            icon={<Icon name="Mail" size={20} strokeWidth={1.5} className="opacity-80" />}
            onPress={() => openLink(links.email)}
          />

          <View className="mt-3 flex-row items-center gap-2">
            <ThemedText
              className="min-w-0 flex-1 text-xs text-light-subtext dark:text-dark-subtext"
              numberOfLines={1}>
              {shareUrl}
            </ThemedText>
            <CopyIconButton
              value={shareUrl}
              accessibilityLabel={t('barberShareCopyLink')}
            />
          </View>
        </View>
      </ActionSheetThemed>
    );
  }
);
