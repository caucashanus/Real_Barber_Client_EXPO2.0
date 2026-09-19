import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Linking, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ShareUrlCopyRow from '@/components/shared/ShareUrlCopyRow';
import { FacebookShareIcon } from '@/components/shared/ShareChannelIcons';
import ThemedText from '@/components/ThemedText';
import {
  buildReferralShareLinks,
  SHARE_OPEN_DELAY_MS,
} from '@/utils/referralShareLinks';

interface ReferralShareSheetProps {
  shareUrl: string;
}

export const ReferralShareSheet = forwardRef<ActionSheetRef, ReferralShareSheetProps>(
  function ReferralShareSheet({ shareUrl }, ref) {
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

    const links = useMemo(() => buildReferralShareLinks(shareUrl, t), [shareUrl, t]);

    const hideSheet = () => innerRef.current?.hide();

    const openLink = (url: string) => {
      hideSheet();
      setTimeout(() => {
        void Linking.openURL(url).catch(() => {});
      }, SHARE_OPEN_DELAY_MS);
    };

    return (
      <ActionSheetThemed ref={setRef} fitContent gestureEnabled>
        <View className="gap-1 px-4 pb-8 pt-2">
          <ThemedText className="mb-2 text-base font-semibold">
            {t('referralShareSheetTitle')}
          </ThemedText>

          <SheetNavRow
            label={t('barberShareFacebook')}
            icon={<FacebookShareIcon size={20} />}
            onPress={() => openLink(links.facebook)}
          />
          <SheetNavRow
            label={t('barberShareTelegram')}
            icon={<Icon name="Send" size={20} strokeWidth={2} color="#229ED9" fill="#229ED9" />}
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
            label={t('referralShareSms')}
            icon={<Icon name="MessageSquare" size={20} strokeWidth={1.5} className="opacity-80" />}
            onPress={() => openLink(links.sms)}
          />
          <SheetNavRow
            label={t('barberShareEmail')}
            icon={<Icon name="Mail" size={20} strokeWidth={1.5} className="opacity-80" />}
            onPress={() => openLink(links.email)}
          />

          <ShareUrlCopyRow
            className="mt-3"
            shareUrl={shareUrl}
            copyAccessibilityLabel={t('barberShareCopyLink')}
          />
        </View>
      </ActionSheetThemed>
    );
  }
);
