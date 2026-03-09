import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext } from 'react';
import { View, Image, Animated, Pressable } from 'react-native';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import ThemedText from '@/components/ThemedText';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { useTranslation } from '@/app/hooks/useTranslation';

const MyHaircutsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { t } = useTranslation();

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        <Pressable
          onPress={() => router.push('/screens/guide-my-haircuts')}
          className="mb-4 py-2"
          accessibilityLabel="What's it for?"
        >
          <ThemedText className="text-base text-highlight font-medium">{t('myHaircutsWhatsFor')}</ThemedText>
        </Pressable>
        <View className="p-10 items-center rounded-3xl bg-slate-200 mt-6 mb-8 dark:bg-dark-secondary">
          <View className="w-20 h-20 relative">
            <View className="w-full h-full rounded-xl relative z-20 overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={require('@/assets/img/myidea.png')} resizeMode="contain" />
            </View>
            <View className="w-full h-full absolute top-0 left-8 rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={require('@/assets/img/myrules.png')} resizeMode="contain" />
            </View>
            <View className="w-full h-full absolute top-0 right-8 -rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={require('@/assets/img/savefinish.png')} resizeMode="contain" />
            </View>
          </View>
          <ThemedText className="text-2xl font-semibold mt-4">{t('myHaircutsCreate')}</ThemedText>
          <ThemedText className="text-sm font-light text-center px-4">{t('myHaircutsCreateDesc')}</ThemedText>
          <Button title={t('profileGetStarted')} className="mt-4" textClassName="text-white" onPress={() => router.push('/screens/add-property-start')} />
        </View>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default MyHaircutsScreen;
