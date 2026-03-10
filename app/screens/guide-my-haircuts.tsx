import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTranslation } from '@/app/hooks/useTranslation';

const GUIDE_STEP_IMAGES = [
  require('@/assets/img/guide-step-1.png'),
  require('@/assets/img/guide-step-2.jpg'),
  require('@/assets/img/guide-step-3.jpg'),
];
const GUIDE_STEP_KEYS = ['guideMyHaircutsStep1', 'guideMyHaircutsStep2', 'guideMyHaircutsStep3'] as const;

export default function GuideMyHaircutsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [step, setStep] = React.useState(0);
  const isLastStep = step === GUIDE_STEP_KEYS.length - 1;
  const stepImage = GUIDE_STEP_IMAGES[step];
  const stepTextKey = GUIDE_STEP_KEYS[step];
  const current = stepImage && stepTextKey ? { image: stepImage, buttonText: t(stepTextKey) } : null;

  const onButtonPress = () => {
    if (isLastStep) {
      router.back();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!current) return null;

  return (
    <View className="flex-1">
      <Pressable className="flex-1" onPress={onButtonPress}>
        <Image
          source={current.image}
          className="w-full h-full"
          resizeMode="cover"
          accessibilityLabel={`Guide step ${step + 1}`}
        />
      </Pressable>
      <View
        className="absolute bottom-0 left-0 right-0 px-6 pt-6"
        style={{
          paddingBottom: insets.bottom + 24,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      >
        <ThemedText className="text-sm text-center text-white mt-1 px-2">
          {current.buttonText}
        </ThemedText>
        <Button
          title={isLastStep ? t('guideMyHaircutsGotIt') : t('guideMyHaircutsNext')}
          size="large"
          className="bg-highlight mt-4"
          textClassName="text-white"
          rounded="full"
          onPress={onButtonPress}
        />
      </View>
    </View>
  );
}
