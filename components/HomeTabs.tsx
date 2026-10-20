import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, TouchableOpacity, View } from 'react-native';

import ThemedText from './ThemedText';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  resolveActiveMobileHomeTabId,
  visibleMobileHomeTabs,
  type MobileHomeTabDef,
} from '@/utils/mobileHomeChrome';
import { triggerImpact } from '@/utils/appHaptics';
import * as Haptics from 'expo-haptics';

const TAB_ICON_SLOT = 45;
const SEARCH_MODAL_ICON = 36;

type HomeTabsProps = {
  scrollY: Animated.Value;
};

const HomeTabs = ({ scrollY }: HomeTabsProps) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const tabs = useMemo(() => visibleMobileHomeTabs(), []);
  const activeId = resolveActiveMobileHomeTabId(pathname);

  return (
    <View
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 4 },
      }}
      className="w-full border-b border-gray-200 bg-light-primary pt-3 dark:border-dark-secondary dark:bg-dark-primary">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={t('mobileHomeTabsAria')}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={tab.id === activeId}
            label={t(tab.labelKey)}
            scrollY={scrollY}
          />
        ))}
      </ScrollView>
    </View>
  );
};

type TabItemProps = {
  tab: MobileHomeTabDef;
  active: boolean;
  label: string;
  scrollY: Animated.Value;
};

const TabItem = ({ tab, active, label, scrollY }: TabItemProps) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const animatedSize = useRef(new Animated.Value(TAB_ICON_SLOT)).current;

  const iconSource =
    tab.id === 'realBarber' && isDark && tab.iconDark ? tab.iconDark : tab.icon;

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      if (value > 20 && isExpanded) {
        setIsExpanded(false);
        Animated.timing(animatedSize, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else if (value <= 10 && !isExpanded) {
        setIsExpanded(true);
        Animated.timing(animatedSize, {
          toValue: TAB_ICON_SLOT,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => scrollY.removeListener(listenerId);
  }, [scrollY, animatedSize, isExpanded]);

  const handlePress = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(tab.href as never);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.5}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={`min-w-[72px] items-center border-b-2 px-6 pb-2 ${active ? 'border-black dark:border-white' : 'border-transparent'}`}>
      <Animated.View
        style={{
          width: animatedSize,
          height: animatedSize,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image
          source={iconSource}
          style={
            tab.searchModalIcon
              ? { width: SEARCH_MODAL_ICON, height: SEARCH_MODAL_ICON }
              : { width: '100%', height: '100%' }
          }
          contentFit="contain"
        />
      </Animated.View>
      <ThemedText
        className={`mt-2 text-xs ${active ? 'font-bold' : 'font-normal text-gray-500 dark:text-gray-400'}`}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default HomeTabs;
