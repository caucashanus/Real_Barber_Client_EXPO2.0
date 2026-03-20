import React from 'react';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import Divider from '@/components/layout/Divider';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function ReservationCreateStartScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <>
      <Header showBackButton />
      <View className="flex-1 px-6 justify-start bg-light-primary dark:bg-dark-primary">
        <View className="pb-6 mt-4">
          <ThemedText className="text-4xl font-semibold mb-8">{t('reservationStartTitle')}</ThemedText>
        </View>

        <IntroStep
          number="1"
          title={t('reservationStartStep1Title')}
          description={t('reservationStartStep1Desc')}
          image={require('@/assets/img/myidea.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="2"
          title={t('reservationStartStep2Title')}
          description={t('reservationStartStep2Desc')}
          image={require('@/assets/img/myrules.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="3"
          title={t('reservationStartStep3Title')}
          description={t('reservationStartStep3Desc')}
          image={require('@/assets/img/savefinish.png')}
        />

        <View className="pb-2 mt-auto" style={{ paddingBottom: insets.bottom }}>
          <Button
            size="large"
            variant="primary"
            textClassName="text-white"
            rounded="full"
            title={t('reservationStartCta')}
            href="/screens/reservation-create"
          />
        </View>
      </View>
    </>
  );
}

function IntroStep(props: { number: string; title: string; description: string; image: number }) {
  return (
    <View className="flex-row items-start py-4">
      <ThemedText className="text-lg font-semibold mr-4">{props.number}</ThemedText>
      <View className="flex-1 mr-6">
        <ThemedText className="text-lg font-semibold">{props.title}</ThemedText>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{props.description}</ThemedText>
      </View>
      <Image source={props.image} className="w-24 h-24 ml-auto" />
    </View>
  );
}
