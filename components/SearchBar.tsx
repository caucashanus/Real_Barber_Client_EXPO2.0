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
import { useTranslation } from '@/app/hooks/useTranslation';

const NAV_ITEM_IDS = ['branches', 'bookings', 'barbers', 'services', 'schedule', 'favorites'] as const;
const NAV_ICONS: IconName[] = ['MapPin', 'Calendar', 'UserCircle', 'Scissors', 'CalendarDays', 'Heart'];
const NAV_HREFS = ['/screens/map', '/trips', '/experience', '/services', '/screens/schedule', '/favorites'];

const SearchBar = () => {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <View className='px-global  bg-light-primary dark:bg-dark-primary w-full relative z-50'>
        <Pressable onPress={() => setShowModal(true)}>
          <Animated.View
            sharedTransitionTag="searchBar"
            style={{ elevation: 10, height: 50, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8.84, shadowOffset: { width: 0, height: 0 } }}
            className='bg-light-primary flex-row justify-center relative z-50 py-4 px-10 mt-3 mb-4  dark:bg-white/20 rounded-full'>
            <Icon name="Search" size={16} strokeWidth={3} />
            <ThemedText className='text-black dark:text-white font-medium ml-2 mr-4'>{t('searchPlaceholder')}</ThemedText>
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

const TITLE_KEYS = ['searchBranches', 'searchMyBookings', 'searchBarbers', 'searchServices', 'searchSchedule', 'searchFavorites'] as const;
const SUBTITLE_KEYS = ['searchBranchesSubtitle', 'searchMyBookingsSubtitle', 'searchBarbersSubtitle', 'searchServicesSubtitle', 'searchScheduleSubtitle', 'searchFavoritesSubtitle'] as const;

const SearchModal = ({ showModal, setShowModal }: SearchModalProps) => {
  const { t } = useTranslation();
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

              {NAV_ITEM_IDS.map((id, i) => (
                <Pressable
                  key={id}
                  onPress={() => handleNav(NAV_HREFS[i])}
                  style={{ ...shadowPresets.large }}
                  className="flex-row items-center w-full p-global mb-4 bg-light-primary dark:bg-dark-secondary rounded-2xl">
                  <View className="w-12 h-12 rounded-xl bg-light-secondary dark:bg-dark-primary items-center justify-center mr-4">
                    <Icon name={NAV_ICONS[i]} size={24} />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-lg font-semibold">{t(TITLE_KEYS[i])}</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t(SUBTITLE_KEYS[i])}</ThemedText>
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
