import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import HomeKidsWatchSheet from '@/components/home/kids/HomeKidsWatchSheet';
import Section from '@/components/layout/Section';
import { SURFACE_CARD_BG_CLASS } from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { HOME_FAST_BOOK_SERVICES } from '@/constants/homeFastBookServices';
import { HOME_MORE_CIRCLES, type HomeMoreCircleDef } from '@/constants/homeMoreCircles';
import { useAuth } from '@/contexts/AuthContext';
import { useKidsWatchSheetLauncher } from '@/hooks/useKidsWatchSheetLauncher';
import { useTranslation } from '@/hooks/useTranslation';
import { navigateHomeFastBookLater } from '@/utils/homeFastBookBookingNav';

/** Web mobil: `size-10` (40 px) v kruhu 72 px — styl, děti, interval. */
const ICON_INSET_PX = 40;
/** Web mobil: `size-11` (44 px) — Návody bez `imageInset`. */
const ICON_GUIDES_PX = 44;
const CIRCLE_PX = 72;

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
        default:
          break;
      }
    },
    [openFromHome]
  );

  if (!client && !apiToken) return null;

  return (
    <>
      <Section
        title={t('homeMoreTitle')}
        titleSize="lg"
        className={className}
        titleAlign="left">
        <View className="mt-3 flex-row gap-x-2">
          {HOME_MORE_CIRCLES.map((item) => {
            const iconPx = item.imageInset ? ICON_INSET_PX : ICON_GUIDES_PX;
            return (
              <Pressable
                key={item.id}
                onPress={() => onCirclePress(item)}
                accessibilityRole="button"
                accessibilityLabel={t(item.labelKey)}
                className="min-w-0 flex-1 active:opacity-70">
                <View className="flex-col items-center gap-2.5">
                  <View
                    className={`items-center justify-center rounded-full ${SURFACE_CARD_BG_CLASS}`}
                    style={{ width: CIRCLE_PX, height: CIRCLE_PX }}>
                    <Image
                      source={item.icon}
                      style={{ width: iconPx, height: iconPx }}
                      contentFit="contain"
                    />
                  </View>
                  <ThemedText
                    className="w-full px-0.5 text-center text-xs font-semibold leading-tight"
                    numberOfLines={2}>
                    {t(item.labelKey)}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
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
    </>
  );
}
