import React from 'react';
import { View } from 'react-native';

import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import {
  openOperatorPhone,
  openOperatorTelegram,
  openOperatorWhatsApp,
} from '@/utils/operatorContact';

const CONTACT_OPEN_DELAY_MS = 300;

const BRAND_WHATSAPP = '#25D366';
const BRAND_TELEGRAM = '#229ED9';

interface OperatorContactChannelsProps {
  /** Zavře parent sheet před otevřením kanálu (nested sheet pattern). */
  onBeforeOpen?: () => void;
}

function runChannelAction(onBeforeOpen: (() => void) | undefined, action: () => Promise<void>) {
  onBeforeOpen?.();
  setTimeout(() => {
    void action().catch(() => {});
  }, CONTACT_OPEN_DELAY_MS);
}

/** Tel / WhatsApp / Telegram — řádky jako u sdílení (ne velké barevné CTA). */
export default function OperatorContactChannels({ onBeforeOpen }: OperatorContactChannelsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="gap-1">
      <SheetNavRow
        label={t('operatorContactPhone')}
        icon={<Icon name="Phone" size={20} strokeWidth={2} color={colors.text} />}
        onPress={() => runChannelAction(onBeforeOpen, openOperatorPhone)}
      />
      <SheetNavRow
        label={t('operatorContactWhatsApp')}
        icon={
          <Icon
            name="MessageCircle"
            size={20}
            strokeWidth={2}
            color={BRAND_WHATSAPP}
            fill={BRAND_WHATSAPP}
          />
        }
        onPress={() => runChannelAction(onBeforeOpen, openOperatorWhatsApp)}
      />
      <SheetNavRow
        label={t('operatorContactTelegram')}
        icon={<Icon name="Send" size={20} strokeWidth={2} color={BRAND_TELEGRAM} fill={BRAND_TELEGRAM} />}
        onPress={() => runChannelAction(onBeforeOpen, openOperatorTelegram)}
      />
    </View>
  );
}
