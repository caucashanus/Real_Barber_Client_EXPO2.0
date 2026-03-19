import React from 'react';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import Divider from '@/components/layout/Divider';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';

export default function ReservationCreateStartScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Header showBackButton />
      <View className="flex-1 px-6 justify-start bg-light-primary dark:bg-dark-primary">
        <View className="pb-6 mt-4">
          <ThemedText className="text-4xl font-semibold mb-8">Jednoduše vytvoříme rezervaci</ThemedText>
        </View>

        <IntroStep
          number="1"
          title="Vyberte pobočku"
          description="Zvolte salon, kam chcete jít."
          image={require('@/assets/img/myidea.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="2"
          title="Vyberte specialistu a službu"
          description="Zvolte specialistu a službu, kterou chcete rezervovat."
          image={require('@/assets/img/myrules.png')}
        />
        <Divider className="my-4" />
        <IntroStep
          number="3"
          title="Vyberte termín"
          description="Zobrazíme dostupné časy a potvrdíte rezervaci."
          image={require('@/assets/img/savefinish.png')}
        />

        <View className="pb-2 mt-auto" style={{ paddingBottom: insets.bottom }}>
          <Button
            size="large"
            variant="primary"
            textClassName="text-white"
            rounded="full"
            title="Jdeme na to"
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
