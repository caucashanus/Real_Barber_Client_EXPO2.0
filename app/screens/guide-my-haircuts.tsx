import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';

const GUIDE_STEPS = [
  {
    image: require('@/assets/img/guide-step-1.jpg'),
    buttonText: "Whenever you have an idea, create your haircut — give it a name and save it. Then show it at the branch and the barber knows exactly what you want.",
  },
  {
    image: require('@/assets/img/guide-step-2.jpg'),
    buttonText: "At the branch just show the barber your saved haircut. No need to explain — the barber sees exactly what you want.",
  },
  {
    image: require('@/assets/img/guide-step-3.jpg'),
    buttonText: "You have all your haircuts in one place. Add more anytime or show them at your next visit.",
  },
];

export default function GuideMyHaircutsScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = React.useState(0);
  const current = GUIDE_STEPS[step];
  const isLastStep = step === GUIDE_STEPS.length - 1;

  const onButtonPress = () => {
    if (isLastStep) {
      router.back();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!current) return null;

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Pressable className="flex-1" onPress={onButtonPress}>
        <Image
          source={current.image}
          className="w-full h-full"
          resizeMode="cover"
          accessibilityLabel={`Guide step ${step + 1}`}
        />
      </Pressable>
      <View
        className="px-6 pb-6 pt-4 bg-light-primary dark:bg-dark-primary"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Button
          title={isLastStep ? "Got it" : "Next"}
          size="large"
          className="bg-highlight"
          textClassName="text-white"
          rounded="full"
          onPress={onButtonPress}
        />
        <ThemedText className="text-sm text-center text-light-subtext dark:text-dark-subtext mt-3 px-2">
          {current.buttonText}
        </ThemedText>
      </View>
    </View>
  );
}
