import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, View, Platform, ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedView from './AnimatedView';
import Icon from './Icon';
import ThemedScroller from './ThemeScroller';
import ThemedText from './ThemedText';

import SurfaceCard from '@/components/layout/SurfaceCard';
import { useTranslation } from '@/hooks/useTranslation';
import { shadowPresets } from '@/utils/useShadow';

const NAV_ITEM_IDS = [
  'branches',
  'bookings',
  'barbers',
  'services',
  'schedule',
  'favorites',
] as const;
const NAV_HREFS = [
  '/screens/map',
  '/bookings',
  '/experience',
  '/services',
  '/screens/schedule',
  '/favorites',
];

const SEARCH_MODAL_IMAGES: ImageSourcePropType[] = [
  require('@/assets/img/search-modal-branches.png'),
  require('@/assets/img/search-modal-bookings.png'),
  require('@/assets/img/search-modal-barbers.png'),
  require('@/assets/img/search-modal-services.png'),
  require('@/assets/img/search-modal-schedule.png'),
  require('@/assets/img/search-modal-favorites.png'),
];

const SearchBar = () => {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <View className="relative  z-50 w-full bg-light-primary px-global dark:bg-dark-primary">
        <Pressable onPress={() => setShowModal(true)}>
          <Animated.View
            sharedTransitionTag="searchBar"
            style={{
              elevation: 10,
              height: 36,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 8.84,
              shadowOffset: { width: 0, height: 0 },
            }}
            className="relative z-50 mb-2 mt-2 flex-row items-center justify-center rounded-full bg-light-primary px-10 dark:bg-white/20">
            <Icon name="Search" size={14} strokeWidth={3} />
            <ThemedText className="ml-2 mr-4 text-sm font-medium text-black dark:text-white">
              {t('searchPlaceholder')}
            </ThemedText>
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

const TITLE_KEYS = [
  'searchBranches',
  'searchMyBookings',
  'searchBarbers',
  'searchServices',
  'searchSchedule',
  'searchFavorites',
] as const;
const SUBTITLE_KEYS = [
  'searchBranchesSubtitle',
  'searchMyBookingsSubtitle',
  'searchBarbersSubtitle',
  'searchServicesSubtitle',
  'searchScheduleSubtitle',
  'searchFavoritesSubtitle',
] as const;

const SearchModal = ({ showModal, setShowModal }: SearchModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleNav = (href: string) => {
    setShowModal(false);
    router.push(href as any);
  };

  return (
    <Modal statusBarTranslucent visible={showModal} transparent animationType="fade">
      <BlurView
        experimentalBlurMethod="none"
        intensity={20}
        tint="systemUltraThinMaterialLight"
        className="flex-1">
        <AnimatedView
          className="flex-1"
          animation="slideInTop"
          duration={Platform.OS === 'ios' ? 500 : 0}
          delay={0}>
          <View className="flex-1 bg-neutral-200/70 dark:bg-black/90">
            <ThemedScroller style={{ paddingTop: insets.top + 10 }} className="bg-transparent">
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  ...shadowPresets.card,
                  elevation: 10,
                  height: 50,
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 8.84,
                  shadowOffset: { width: 0, height: 0 },
                }}
                className="my-3 ml-auto h-12 w-12 items-center justify-center rounded-full bg-light-primary dark:bg-dark-secondary">
                <Icon name="X" size={24} strokeWidth={2} />
              </Pressable>

              {NAV_ITEM_IDS.map((id, i) => (
                <Pressable key={id} onPress={() => handleNav(NAV_HREFS[i])} className="mb-4 w-full">
                  <SurfaceCard rounded="2xl" className="w-full flex-row items-center p-global">
                  <View className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-light-surface dark:bg-dark-primary">
                    <Image
                      source={SEARCH_MODAL_IMAGES[i]}
                      className="h-8 w-8"
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-lg font-semibold">{t(TITLE_KEYS[i])}</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {t(SUBTITLE_KEYS[i])}
                    </ThemedText>
                  </View>
                  <Icon
                    name="ChevronRight"
                    size={20}
                    className="text-light-subtext dark:text-dark-subtext"
                  />
                  </SurfaceCard>
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
