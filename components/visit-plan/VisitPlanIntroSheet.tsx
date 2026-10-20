import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import { VISIT_PLAN_INTRO_BANNER } from '@/constants/visitPlanOnboardingAssets';
import { useActionSheetVisible } from '@/hooks/useActionSheetVisible';
import { useTranslation } from '@/hooks/useTranslation';
import { markVisitPlanIntroSheetSeen } from '@/utils/visitPlanIntroStorage';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function VisitPlanIntroSheet({ open, onOpenChange }: Props) {
  const ref = useActionSheetVisible(open);
  const { t } = useTranslation();

  return (
    <ActionSheetThemed ref={ref} fitContent gestureEnabled onClose={() => onOpenChange(false)}>
      <View className="px-global pb-8 pt-2">
        <Image
          source={VISIT_PLAN_INTRO_BANNER}
          style={{ width: '100%', height: 180, borderRadius: 16 }}
          contentFit="cover"
        />
        <ThemedText className="mt-4 text-lg font-bold">{t('visitPlanIntroTitle')}</ThemedText>
        <ThemedText className="mt-2 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
          {t('visitPlanIntroLead')}
        </ThemedText>
        <View className="mt-6">
          <AppButton
            size="lg"
            variant="default"
            rounded="full"
            fullWidth
            textClassName="text-white"
            title={t('visitPlanIntroContinue')}
            onPress={async () => {
              await markVisitPlanIntroSheetSeen();
              onOpenChange(false);
            }}
          />
        </View>
      </View>
    </ActionSheetThemed>
  );
}
