import React, { useMemo } from 'react';
import { Linking, View } from 'react-native';

import ReserveButton from '@/components/ReserveButton';
import BranchChannelIconButton from '@/components/branch/BranchChannelIconButton';
import Icon from '@/components/Icon';
import type { TranslationKey } from '@/locales';
import { buildBranchContactMessageLinks } from '@/utils/branchContactMessageLinks';

interface BranchContactActionsProps {
  branchName: string;
  bookingHref: string;
  t: (key: TranslationKey) => string;
}

export default function BranchContactActions({
  branchName,
  bookingHref,
  t,
}: BranchContactActionsProps) {
  const links = useMemo(
    () => buildBranchContactMessageLinks(branchName, t),
    [branchName, t]
  );

  const openLink = (url: string) => {
    void Linking.openURL(url).catch(() => {});
  };

  return (
    <View className="mb-global flex-row items-center">
      <ReserveButton
        title={t('commonReserve')}
        size="sm"
        rounded="lg"
        className="min-w-0 flex-1 px-4"
        textClassName="text-sm font-semibold"
        href={bookingHref}
      />
      <View className="ml-2">
        <BranchChannelIconButton
          label={t('branchContactSmsAria')}
          bgClassName="bg-[#FFD60A]"
          onPress={() => openLink(links.sms)}>
          <Icon name="MessageCircle" size={14} color="#1a1a1a" />
        </BranchChannelIconButton>
      </View>
      <View className="ml-2">
        <BranchChannelIconButton
          label={t('branchContactWhatsAppAria')}
          bgClassName="bg-[#25D366]"
          onPress={() => openLink(links.whatsApp)}>
          <Icon name="MessageCircle" size={14} color="#FFFFFF" />
        </BranchChannelIconButton>
      </View>
      <View className="ml-2">
        <BranchChannelIconButton
          label={t('branchContactTelegramAria')}
          bgClassName="bg-[#0088cc]"
          onPress={() => openLink(links.telegram)}>
          <Icon name="Send" size={14} color="#FFFFFF" />
        </BranchChannelIconButton>
      </View>
    </View>
  );
}
