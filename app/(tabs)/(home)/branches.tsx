import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { Animated, Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { ScrollContext } from './_layout';

import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import AppButton from '@/components/AppButton';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import CustomCard from '@/components/CustomCard';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { getBranchContactMeta } from '@/constants/branchContacts';
import { getBranchInteriorCarouselImages } from '@/constants/branchInteriorGallery';
import { resolveCrmBranchId, type BranchInternalId } from '@/constants/crmBranchIds';
import { branchDetailHref } from '@/constants/profileDetailRoutes';
import { KUDY_K_NAM_VIDEOS } from '@/constants/kudy-k-nam-videos';
import type { TranslationKey } from '@/locales';
import {
  OPERATOR_SUPPORT_DISPLAY,
  openOperatorPhone,
} from '@/utils/operatorContact';
import { getContentCarouselSize } from '@/utils/contentCarouselLayout';

const HELP_EMAIL = 'info@realbarber.cz';
const BRANCH_ORDER: BranchInternalId[] = ['barrandov', 'hagibor', 'kacerov', 'modrany'];

const BRANCH_NOTE_KEYS: Record<BranchInternalId, TranslationKey> = {
  barrandov: 'contactsBranchNoteBarrandov',
  hagibor: 'contactsBranchNoteHagibor',
  kacerov: 'contactsBranchNoteKacerov',
  modrany: 'contactsBranchNoteModrany',
};

const BRAND_WAZE = '#33CCFF';
const BRAND_GOOGLE_MAPS = '#34A853';

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
}

export default function BranchesScreen() {
  const scrollY = useContext(ScrollContext);
  const { width: screenWidth } = useWindowDimensions();
  const branchCarouselSize = useMemo(
    () => getContentCarouselSize(screenWidth),
    [screenWidth]
  );
  const callUsRef = useRef<ActionSheetRef>(null);
  const navigateRefs = useRef<Partial<Record<BranchInternalId, ActionSheetRef | null>>>({});
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyFeedback();
  const colors = useThemeColors();

  const openBranchDetail = useCallback((branchId: BranchInternalId) => {
    const crmBranchId = resolveCrmBranchId(branchId);
    router.push(branchDetailHref(crmBranchId) as never);
  }, []);

  return (
    <>
      <ThemeScroller
        ref={scrollRef}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <View className="mt-4 w-full flex-1">
          <AnimatedView animation="scaleIn" className="flex-1">
            <CustomCard
              rounded="2xl"
              padding="md"
              border
              background={false}>
              <ThemedText className="text-lg font-semibold">{t('contactsTitle')}</ThemedText>
              <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                {t('contactsIntro')}
              </ThemedText>

              <View className="mt-5 gap-2">
                <Pressable onPress={() => void openOperatorPhone().catch(() => {})}>
                  <ThemedText className="text-sm font-medium">{OPERATOR_SUPPORT_DISPLAY}</ThemedText>
                </Pressable>
                <Pressable onPress={() => openUrl(`mailto:${HELP_EMAIL}`)}>
                  <ThemedText className="text-sm font-medium">{HELP_EMAIL}</ThemedText>
                </Pressable>
              </View>

              <View className="mt-5 gap-1">
                <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                  {t('contactsBranchHoursIntro')}
                </ThemedText>
                <ThemedText className="text-sm leading-6">{t('nearestBranchHoursWeekdays')}</ThemedText>
                <ThemedText className="text-sm leading-6">{t('nearestBranchHoursWeekend')}</ThemedText>
              </View>

              <View className="mt-5">
                <BranchOpenStatusRow t={t} variant="operatorSupport" />
              </View>

              <View className="mt-5 flex-row gap-1.5">
                {BRANCH_ORDER.map((branchId) => {
                  const meta = getBranchContactMeta(branchId);
                  return (
                    <Pressable
                      key={branchId}
                      onPress={() => openBranchDetail(branchId)}
                      accessibilityRole="button"
                      accessibilityLabel={meta.shortLabel}
                      className="active:opacity-70">
                      <Image
                        source={meta.carouselImage}
                        className="h-8 w-8 rounded-sm"
                        contentFit="cover"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </CustomCard>

          {BRANCH_ORDER.map((branchId) => {
            const meta = getBranchContactMeta(branchId);
            const branchImages = getBranchInteriorCarouselImages(branchId);
            const kudy = KUDY_K_NAM_VIDEOS.find((item) => item.id === branchId);
            const openNavigate = () => navigateRefs.current[branchId]?.show();
            const openCallUs = () => callUsRef.current?.show();

            return (
              <View key={branchId} className="mt-6 w-full pb-4">
                {branchImages.length > 0 ? (
                  <View className="mb-4">
                    <ImageCarousel
                      width={branchCarouselSize.width}
                      height={branchCarouselSize.height}
                      rounded="xl"
                      className="w-full"
                      images={branchImages}
                      paginationStyle="dots"
                      paginationPlacement="overlay"
                      showPagination={branchImages.length > 1}
                      onImagePress={() => openBranchDetail(branchId)}
                      getAccessibilityLabel={(index) =>
                        `${meta.shortLabel} ${index + 1}/${branchImages.length}`
                      }
                    />
                  </View>
                ) : null}

                <View className="w-full">
                  <Pressable
                    onPress={() => openBranchDetail(branchId)}
                    className="self-start active:opacity-70">
                    <View className="flex-row items-center gap-2">
                      <Image
                        source={meta.carouselImage}
                        className="h-7 w-7 rounded-sm"
                        contentFit="cover"
                        accessibilityLabel={meta.shortLabel}
                      />
                      <ThemedText className="text-lg font-semibold">
                        Real Barber {meta.shortLabel}
                      </ThemedText>
                    </View>
                  </Pressable>

                  <View className="mt-2 gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('branchCopyAddress')}
                      onPress={() => copyToClipboard(meta.address)}
                      className="flex-row items-center gap-1.5 active:opacity-70">
                      <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                        {meta.address}
                      </ThemedText>
                      <Icon
                        name="Copy"
                        size={12}
                        className="shrink-0 text-light-subtext dark:text-dark-subtext"
                      />
                    </Pressable>

                    <View>
                      {kudy?.uberUrl ? (
                        <Pressable
                          onPress={() => openUrl(kudy.uberUrl!)}
                          className="flex-row items-center gap-1.5 active:opacity-70">
                          <Icon
                            name="Car"
                            size={20}
                            strokeWidth={1.5}
                            color={colors.text}
                            className="shrink-0 opacity-90"
                          />
                          <ThemedText className="text-sm font-medium leading-6">
                            {t('contactsTravelUber')}
                          </ThemedText>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={() =>
                          openUrl(
                            kudy?.wazeUrl ??
                              `https://waze.com/ul?ll=${meta.latitude},${meta.longitude}&navigate=yes`
                          )
                        }
                        className="flex-row items-center gap-1.5 active:opacity-70">
                        <Icon
                          name="Navigation"
                          size={20}
                          strokeWidth={1.5}
                          color={BRAND_WAZE}
                          fill={BRAND_WAZE}
                          className="shrink-0"
                        />
                        <ThemedText className="text-sm font-medium leading-6">
                          {t('contactsTravelWaze')}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          openUrl(
                            `https://www.google.com/maps/dir/?api=1&destination=${meta.latitude},${meta.longitude}`
                          )
                        }
                        className="flex-row items-center gap-1.5 active:opacity-70">
                        <Icon
                          name="MapPin"
                          size={20}
                          strokeWidth={1.5}
                          color={BRAND_GOOGLE_MAPS}
                          fill={BRAND_GOOGLE_MAPS}
                          className="shrink-0"
                        />
                        <ThemedText className="text-sm font-medium leading-6">
                          {t('contactsTravelGoogleMaps')}
                        </ThemedText>
                      </Pressable>
                      <View className="flex-row items-center gap-1.5">
                        <Icon
                          name="Accessibility"
                          size={20}
                          strokeWidth={1.5}
                          className="shrink-0 opacity-80"
                        />
                        <ThemedText className="text-sm font-medium leading-6">
                          {t('contactsAccessible')}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View className="mt-3 gap-3">
                    <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                      {t(BRANCH_NOTE_KEYS[branchId])}
                    </ThemedText>

                    <View className="flex-row flex-wrap gap-2">
                      <AppButton
                        title={t('nearestBranchOpen')}
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="px-3 py-2"
                        iconStart="ExternalLink"
                        iconSize={14}
                        textClassName="text-xs font-semibold"
                        onPress={() => openBranchDetail(branchId)}
                      />
                      <AppButton
                        title={t('branchNavigateSectionTitle')}
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="px-3 py-2"
                        iconStart="Navigation"
                        iconSize={14}
                        textClassName="text-xs font-semibold"
                        onPress={openNavigate}
                      />
                      <AppButton
                        title={t('barberPhoneCall')}
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="px-3 py-2"
                        iconStart="Phone"
                        iconSize={14}
                        textClassName="text-xs font-semibold"
                        onPress={openCallUs}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          </AnimatedView>
        </View>
      </ThemeScroller>

      <OperatorSupportSheet ref={callUsRef} variant="callUs" />
      {BRANCH_ORDER.map((branchId) => {
        const meta = getBranchContactMeta(branchId);
        return (
          <BranchNavigateSheet
            key={`navigate-${branchId}`}
            ref={(node) => {
              navigateRefs.current[branchId] = node;
            }}
            branchName={meta.shortLabel}
            address={meta.address}
            latitude={meta.latitude}
            longitude={meta.longitude}
          />
        );
      })}
    </>
  );
}
