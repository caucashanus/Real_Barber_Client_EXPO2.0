import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef } from 'react';
import {
  View,
  Animated,
  ScrollView,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useBranchDetailScreen } from '@/app/hooks/useBranchDetailScreen';
import { useTranslation } from '@/app/hooks/useTranslation';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import BranchAddressRow from '@/components/branch/BranchAddressRow';
import BranchDescriptionModal from '@/components/branch/BranchDescriptionModal';
import BranchDescriptionPreview from '@/components/branch/BranchDescriptionPreview';
import BranchHeaderInfo from '@/components/branch/BranchHeaderInfo';
import BranchLinksSection from '@/components/branch/BranchLinksSection';
import BranchRatingModal from '@/components/branch/BranchRatingModal';
import BranchReviewsSection from '@/components/branch/BranchReviewsSection';
import BranchTeamSection from '@/components/branch/BranchTeamSection';
import Divider from '@/components/layout/Divider';
import {
  branchCarouselImages,
  buildBranchReviewParams,
  getEmployeesList,
  getVrTourUrl,
} from '@/utils/branchDetailHelpers';

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    branch,
    loading,
    error,
    reviews,
    loadingReviews,
    hasReviewed,
    descriptionModalVisible,
    setDescriptionModalVisible,
    ratingModalVisible,
    setRatingModalVisible,
    countByRating,
    average,
    displayTotal,
  } = useBranchDetailScreen(id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const roundedViewYRef = useRef(0);
  const reviewsSectionYInRoundedRef = useRef(0);

  const scrollToReviews = useCallback(() => {
    const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  if (!loading && (error || !branch)) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Branch not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  if (!branch) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 bg-light-primary dark:bg-dark-primary" />
      </>
    );
  }

  const images = branchCarouselImages(branch) as ImageSourcePropType[];
  const employeesList = getEmployeesList(branch);
  const vrTourUrl = getVrTourUrl(branch.name);
  const webUrl = branch.webUrl ?? null;
  const reviewParams = buildBranchReviewParams(branch);
  const rightComponents = branch.name
    ? [
        <Favorite
          key="fav"
          productName={branch.name}
          title={branch.name}
          entityType="branch"
          entityId={branch.id}
          size={25}
          isWhite
        />,
      ]
    : undefined;

  return (
    <>
      <StatusBar style="light" translucent />
      <Header variant="transparent" title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        ref={scrollRef}
        className="bg-light-primary px-0 dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <ImageCarousel
          images={images}
          height={500}
          paginationStyle="dots"
          autoPlay
          autoPlayInterval={3000}
          loop
          scrollY={heroScrollY}
          stretchOnPullDown
        />

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="-mt-[30px] bg-light-primary p-global dark:bg-dark-primary"
          onLayout={(e: LayoutChangeEvent) => {
            roundedViewYRef.current = e.nativeEvent.layout.y;
          }}>
          <BranchHeaderInfo
            name={branch.name}
            address={branch.address}
            average={average}
            hasReviewed={hasReviewed}
            reviewParams={reviewParams}
            onScrollToReviews={scrollToReviews}
            onNavigatePress={() => branchNavigateRef.current?.show()}
            t={t}
          />

          <BranchAddressRow branch={branch} t={t} />

          {branch.description ? (
            <BranchDescriptionPreview
              description={branch.description}
              onReadMore={() => setDescriptionModalVisible(true)}
              t={t}
            />
          ) : null}

          <BranchTeamSection employees={employeesList} t={t} />

          <Divider className="mb-4 mt-8" />

          <BranchReviewsSection
            reviews={reviews}
            loadingReviews={loadingReviews}
            hasReviewed={hasReviewed}
            reviewParams={reviewParams}
            countByRating={countByRating}
            average={average}
            displayTotal={displayTotal}
            clientId={client?.id}
            locale={locale}
            onLayout={(e) => {
              reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y;
            }}
            onOpenRatingModal={() => setRatingModalVisible(true)}
            t={t}
          />

          <Divider className="mb-4 mt-8" />

          <BranchLinksSection branchId={branch.id} vrTourUrl={vrTourUrl} webUrl={webUrl} t={t} />

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="border-t border-neutral-200 bg-light-primary px-global pt-4 dark:border-dark-secondary dark:bg-dark-primary">
        <Button
          title={t('branchReserve')}
          variant="primary"
          className="w-full"
          size="medium"
          rounded="lg"
          href={`/screens/reservation-create?branchId=${encodeURIComponent(branch.id)}`}
        />
      </View>

      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={branch.name}
        address={branch.address}
      />

      <BranchDescriptionModal
        visible={descriptionModalVisible}
        description={branch.description}
        onClose={() => setDescriptionModalVisible(false)}
        t={t}
      />

      <BranchRatingModal
        visible={ratingModalVisible}
        countByRating={countByRating}
        average={average}
        displayTotal={displayTotal}
        onClose={() => setRatingModalVisible(false)}
        t={t}
      />
    </>
  );
}
