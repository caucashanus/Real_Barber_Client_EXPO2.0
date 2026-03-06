import { Modal, Pressable, View, Platform } from "react-native";
import Animated from 'react-native-reanimated';
import Icon, { IconName } from "./Icon";
import ThemedText from "./ThemedText";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AnimatedView from "./AnimatedView";
import ThemedScroller from "./ThemeScroller";
import { shadowPresets } from '@/utils/useShadow';
import { BlurView } from "expo-blur";

const SearchBar = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <View className='px-global  bg-light-primary dark:bg-dark-primary w-full relative z-50'>
        <Pressable onPress={() => setShowModal(true)}>
          <Animated.View
            sharedTransitionTag="searchBar"
            style={{ elevation: 10, height: 50, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8.84, shadowOffset: { width: 0, height: 0 } }}
            className='bg-light-primary flex-row justify-center relative z-50 py-4 px-10 mt-3 mb-4  dark:bg-white/20 rounded-full'>
            <Icon name="Search" size={16} strokeWidth={3} />
            <ThemedText className='text-black dark:text-white font-medium ml-2 mr-4'>Search here</ThemedText>
          </Animated.View>
        </Pressable>
      </View>
      <SearchModal showModal={showModal} setShowModal={setShowModal} />
    </>
  );
};

interface SearchModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

interface NavItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'branches', title: 'Pobočky', subtitle: 'Prohlédnout pobočky', icon: 'MapPin', href: '/screens/map' },
  { id: 'bookings', title: 'Mé rezervace', subtitle: 'Your bookings', icon: 'Calendar', href: '/trips' },
];

const SearchModal = ({ showModal, setShowModal }: SearchModalProps) => {
  const insets = useSafeAreaInsets();

  const handleNav = (href: string) => {
    setShowModal(false);
    router.push(href as any);
  };

  return (
    <Modal statusBarTranslucent visible={showModal} transparent animationType="fade">
      <BlurView experimentalBlurMethod="none" intensity={20} tint="systemUltraThinMaterialLight" className='flex-1'>
        <AnimatedView className="flex-1" animation='slideInTop' duration={Platform.OS === 'ios' ? 500 : 0} delay={0}>
          <View className="flex-1 bg-neutral-200/70 dark:bg-black/90">
            <ThemedScroller style={{ paddingTop: insets.top + 10 }} className="bg-transparent">
              <Pressable
                onPress={() => setShowModal(false)}
                style={{ ...shadowPresets.card, elevation: 10, height: 50, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8.84, shadowOffset: { width: 0, height: 0 } }}
                className="items-center justify-center w-12 my-3 h-12 rounded-full ml-auto bg-light-primary dark:bg-dark-secondary">
                <Icon name="X" size={24} strokeWidth={2} />
              </Pressable>

              {NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleNav(item.href)}
                  style={{ ...shadowPresets.large }}
                  className="flex-row items-center w-full p-global mb-4 bg-light-primary dark:bg-dark-secondary rounded-2xl">
                  <View className="w-12 h-12 rounded-xl bg-light-secondary dark:bg-dark-primary items-center justify-center mr-4">
                    <Icon name={item.icon} size={24} />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-lg font-semibold">{item.title}</ThemedText>
                    {item.subtitle ? <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{item.subtitle}</ThemedText> : null}
                  </View>
                  <Icon name="ChevronRight" size={20} className="text-light-subtext dark:text-dark-subtext" />
                </Pressable>
              ))}
            </ThemedScroller>
          </View>
        </AnimatedView>
      </BlurView>
    </Modal>
  );
};

export default SearchBar;
