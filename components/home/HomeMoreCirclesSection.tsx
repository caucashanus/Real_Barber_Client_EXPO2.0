import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, View, type ListRenderItem } from 'react-native';

import HomeKidsWatchSheet from '@/components/home/kids/HomeKidsWatchSheet';
import Icon from '@/components/Icon';
import Section from '@/components/layout/Section';
import { SURFACE_CARD_BG_CLASS } from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { HOME_FAST_BOOK_SERVICES } from '@/constants/homeFastBookServices';
import { HOME_MORE_CIRCLES, type HomeMoreCircleDef } from '@/constants/homeMoreCircles';
import { useAuth } from '@/contexts/AuthContext';
import { useKidsWatchSheetLauncher } from '@/hooks/useKidsWatchSheetLauncher';
import { useTranslation } from '@/hooks/useTranslation';
import { navigateHomeFastBookLater } from '@/utils/homeFastBookBookingNav';
import {
  CAROUSEL_BLEED_OUTER_CLASSNAME,
  SITE_CAROUSEL_PAGE_GUTTER_PX,
} from '@/utils/carouselMobileBleed';

/** Web mobil: `size-10` (40 px) v kruhu 72 px — styl, děti, interval. */
const ICON_INSET_PX = 40;
/** Web mobil: `size-11` (44 px) — Návody bez `imageInset`. */
const ICON_GUIDES_PX = 44;
const CIRCLE_PX = 72;
/** Šířka jedné dlaždice — pevná, ne `flex-1` (carousel). */
const CIRCLE_ITEM_WIDTH = 80;
const CIRCLE_ITEM_GAP = 12;

type Props = {
  className?: string;
};

export default function HomeMoreCirclesSection({ className }: Props) {
  const { client, apiToken } = useAuth();
  const { t } = useTranslation();
  const {
    open: kidsOpen,
    setOpen: setKidsOpen,
    initialBookingId,
    openFromHome,
    close: closeKidsWatch,
  } = useKidsWatchSheetLauncher();

  const onCirclePress = useCallback(
    (item: HomeMoreCircleDef) => {
      switch (item.id) {
        case 'style':
          router.push('/my-haircuts' as never);
          return;
        case 'guides':
          router.push('/guides' as never);
          return;
        case 'kids':
          openFromHome();
          return;
        case 'interval':
          router.push('/screens/visit-plan' as never);
          return;
        case 'bored':
          router.push('/screens/rb-games' as never);
          return;
        default:
          break;
      }
    },
    [openFromHome]
  );

  const bleedEndSpacer = useMemo(
    () => <View style={{ width: SITE_CAROUSEL_PAGE_GUTTER_PX }} accessibilityElementsHidden />,
    []
  );

  const renderItem: ListRenderItem<HomeMoreCircleDef> = useCallback(
    ({ item }) => {
      const iconPx = item.imageInset ? ICON_INSET_PX : ICON_GUIDES_PX;
      return (
        <Pressable
          onPress={() => onCirclePress(item)}
          accessibilityRole="button"
          accessibilityLabel={t(item.labelKey)}
          style={{ width: CIRCLE_ITEM_WIDTH }}
          className="active:opacity-70">
          <View className="flex-col items-center gap-2.5">
            <View
              className={`items-center justify-center rounded-full ${SURFACE_CARD_BG_CLASS}`}
              style={{ width: CIRCLE_PX, height: CIRCLE_PX }}>
              {item.lucideIcon ? (
                <Icon
                  name={item.lucideIcon}
                  size={iconPx - 8}
                  className="text-light-text dark:text-dark-text"
                />
              ) : item.icon ? (
                <Image
                  source={item.icon}
                  style={{ width: iconPx, height: iconPx }}
                  contentFit="contain"
                />
              ) : null}
            </View>
            <ThemedText
              className="w-full px-0.5 text-center text-xs font-semibold leading-tight"
              numberOfLines={2}>
              {t(item.labelKey)}
            </ThemedText>
          </View>
        </Pressable>
      );
    },
    [onCirclePress, t]
  );

  if (!client && !apiToken) return null;

  return (
    <View>
      <Section
        title={t('homeMoreTitle')}
        titleSize="lg"
        className={className}
        titleAlign="left">
        <View className={`${CAROUSEL_BLEED_OUTER_CLASSNAME} mt-3`}>
          <FlatList
            data={[...HOME_MORE_CIRCLES]}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingLeft: SITE_CAROUSEL_PAGE_GUTTER_PX,
              columnGap: CIRCLE_ITEM_GAP,
            }}
            ListFooterComponent={bleedEndSpacer}
            className="w-full"
          />
        </View>
      </Section>
      <HomeKidsWatchSheet
        open={kidsOpen}
        onOpenChange={(next) => {
          if (!next) closeKidsWatch();
          else setKidsOpen(true);
        }}
        initialBookingId={initialBookingId}
        registerGlobalOpener
        onCreateKidsBooking={() => {
          closeKidsWatch();
          const kidsService = HOME_FAST_BOOK_SERVICES.find((s) => s.id === 'kids');
          navigateHomeFastBookLater(kidsService ?? null);
        }}
      />
    </View>
  );
}