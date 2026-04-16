import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, TouchableOpacity, View } from 'react-native';

import ThemedText from './ThemedText';

import { useTheme } from '@/app/contexts/ThemeContext';
import { useTranslation } from '@/app/hooks/useTranslation';

const HomeTabs = (props: any) => {
  const currentPath = usePathname();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const realBarberIcon = isDark
    ? require('@/assets/img/wallet/realbarber-dark.png')
    : require('@/assets/img/wallet/realbarber-light.png');

  return (
    <View
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 4 },
      }}
      className="w-full border-b border-gray-200 bg-light-primary dark:border-dark-secondary dark:bg-dark-primary">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
        <TabItem
          href="/real-barber"
          active={currentPath === '/real-barber'}
          label={t('tabRealBarber')}
          icon={realBarberIcon}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/wallet"
          active={currentPath === '/wallet'}
          label={t('tabWallet')}
          icon={require('@/assets/img/wallet.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/my-haircuts"
          active={currentPath === '/my-haircuts'}
          label={t('tabMyHaircuts')}
          icon={require('@/assets/img/my-haircuts.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/branches"
          active={currentPath === '/branches'}
          label={t('tabBranches')}
          icon={require('@/assets/img/branches.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/experience"
          active={currentPath === '/experience'}
          label={t('tabBarbers')}
          icon={require('@/assets/img/barbers.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/services"
          active={currentPath === '/services'}
          label={t('tabServices')}
          icon={require('@/assets/img/services.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/products"
          active={currentPath === '/products'}
          label={t('tabProducts')}
          icon={require('@/assets/img/products.png')}
          scrollY={props.scrollY}
        />
        <TabItem
          href="/guides"
          active={currentPath === '/guides'}
          label={t('tabGuides')}
          icon={require('@/assets/img/guides.png')}
          scrollY={props.scrollY}
        />
      </ScrollView>
    </View>
  );
};

const TabItem = (props: any) => {
  // Track if we're in expanded or collapsed state
  const [isExpanded, setIsExpanded] = useState(true);

  // Animated value for size only
  const animatedSize = useRef(new Animated.Value(45)).current;

  // Listen for scroll position changes
  useEffect(() => {
    const listenerId = props.scrollY.addListener(({ value }: { value: number }) => {
      // Only trigger animation when crossing the threshold
      if (value > 20 && isExpanded) {
        setIsExpanded(false);

        // Size animation only
        Animated.timing(animatedSize, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else if (value <= 10 && !isExpanded) {
        setIsExpanded(true);

        // Size animation only
        Animated.timing(animatedSize, {
          toValue: 45,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    // Clean up listener
    return () => props.scrollY.removeListener(listenerId);
  }, [props.scrollY, animatedSize, isExpanded]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push(props.href);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.5}
      className={`min-w-[72px] items-center border-b-2 px-6 pb-2 ${props.active ? 'border-black dark:border-white' : 'border-transparent'}`}>
      <Animated.View
        style={{
          width: animatedSize,
          height: animatedSize,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image source={props.icon} className="h-full w-full" resizeMode="contain" />
      </Animated.View>
      <ThemedText
        className={`mt-2 text-xs ${props.active ? 'font-bold' : 'font-normal text-gray-500 dark:text-gray-400'}`}>
        {props.label}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default HomeTabs;
