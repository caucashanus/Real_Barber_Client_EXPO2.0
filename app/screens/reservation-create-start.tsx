import { router } from 'expo-router';
import React from 'react';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import { setReservationIntroCooldown24h } from '@/utils/reservation-intro-cooldown';

export default function ReservationCreateStartScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <>
      <Header showBackButton />
      <View className="flex-1 justify-start bg-light-primary px-6 dark:bg-dark-primary">
        <View className="mt-4 pb-6">
          <ThemedText className="mb-8 text-4xl font-semibold">
            {t('reservationStartTitle')}
          </ThemedText>
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

        <View className="mt-auto pb-2" style={{ paddingBottom: insets.bottom }}>
          <Button
            size="large"
            variant="primary"
            textClassName="text-white"
            rounded="full"
            title={t('reservationStartCta')}
            onPress={async () => {
              await setReservationIntroCooldown24h();
              router.push('/screens/reservation-create');
            }}
          />
        </View>
      </View>
    </>
  );
}

function IntroStep(props: { number: string; title: string; description: string; image: number }) {
  return (
    <View className="flex-row items-start py-4">
      <ThemedText className="mr-4 text-lg font-semibold">{props.number}</ThemedText>
      <View className="mr-6 flex-1">
        <ThemedText className="text-lg font-semibold">{props.title}</ThemedText>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {props.description}
        </ThemedText>
      </View>
      <Image source={props.image} className="ml-auto h-24 w-24" />
    </View>
  );
}
