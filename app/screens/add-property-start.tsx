import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import {
  isHaircutIntroCooldownActive,
  setHaircutIntroCooldown24h,
} from '@/utils/haircut-intro-cooldown';

export default function AddPropertyStart() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const fromParam = params.from;
  const from = Array.isArray(fromParam) ? fromParam[0] : fromParam;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const active = await isHaircutIntroCooldownActive();
      if (cancelled) return;
      if (active && from !== 'cta') {
        router.replace('/screens/add-property');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from]);

  return (
    <>
      <Header showBackButton />
      <View className=" flex h-full  flex-1 justify-start bg-light-primary px-6 dark:bg-dark-primary">
        <View className="mt-4 pb-6">
          <ThemedText className="mb-8 text-4xl font-semibold">
            {t('addPropertyEasyTitle')}
          </ThemedText>
        </View>

        <IntroStep
          number="1"
          title={t('addPropertyStep1Title')}
          description={t('addPropertyStep1Desc')}
          image={require('@/assets/img/myidea.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="2"
          title={t('addPropertyStep2Title')}
          description={t('addPropertyStep2Desc')}
          image={require('@/assets/img/myrules.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="3"
          title={t('addPropertyStep3Title')}
          description={t('addPropertyStep3Desc')}
          image={require('@/assets/img/savefinish.png')}
        />

        <View className=" mt-auto pb-2" style={{ paddingBottom: insets.bottom }}>
          <Button
            size="large"
            variant="primary"
            textClassName="text-white"
            rounded="full"
            title={t('addPropertyLetsGo')}
            onPress={async () => {
              await setHaircutIntroCooldown24h();
              router.push('/screens/add-property');
            }}
          />
        </View>
      </View>
    </>
  );
}

const IntroStep = (props: {
  number: string;
  title: string;
  description: string;
  image: number;
}) => {
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
};
