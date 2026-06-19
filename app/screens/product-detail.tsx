import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Share,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveClientProductForDetail } from '@/api/products';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  useSelectedCatalogProduct,
  useSelectedPurchase,
  useSetSelectedCatalogProduct,
  useSetSelectedPurchase,
} from '@/app/contexts/SelectedPurchaseContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import ShowRating from '@/components/ShowRating';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import ProductCatalogDetailsSection from '@/components/product/ProductCatalogDetailsSection';
import ProductDetailBottomBar from '@/components/product/ProductDetailBottomBar';
import ProductDetailReviewsSection, {
  productDetailHeaderReviewSummary,
} from '@/components/product/ProductDetailReviewsSection';
import ProductPurchaseDetailsSection from '@/components/product/ProductPurchaseDetailsSection';
import { buildProductShareMessage, computeReviewStats } from '@/utils/productDetailHelpers';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');

const PropertyDetail = () => {
  const { id: productId } = useLocalSearchParams<{ id?: string }>();
  const selectedPurchase = useSelectedPurchase();
  const setSelectedPurchase = useSetSelectedPurchase();
  const selectedCatalogProduct = useSelectedCatalogProduct();
  const setSelectedCatalogProduct = useSetSelectedCatalogProduct();
  const { apiToken, client } = useAuth();
  const { t, locale } = useTranslation();
  const [isFocused, setIsFocused] = useState(true);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const insets = useSafeAreaInsets();

  const idTrimmed = typeof productId === 'string' ? productId.trim() : '';

  const isFromPurchased = Boolean(
    idTrimmed && selectedPurchase && selectedPurchase.product.id === idTrimmed
  );
  const purchase = isFromPurchased ? selectedPurchase : null;
  const isFromCatalog = Boolean(
    idTrimmed && !purchase && selectedCatalogProduct && selectedCatalogProduct.id === idTrimmed
  );

  const hasProductContext = Boolean(
    idTrimmed &&
      (isFromPurchased || (selectedCatalogProduct && selectedCatalogProduct.id === idTrimmed))
  );
  const [detailHydrate, setDetailHydrate] = useState<'pending' | 'ready' | 'missing'>(() =>
    idTrimmed ? 'pending' : 'missing'
  );

  useEffect(() => {
    if (!idTrimmed) {
      setDetailHydrate('missing');
      return;
    }
    if (hasProductContext) {
      setDetailHydrate('ready');
      return;
    }
    if (!apiToken) {
      setDetailHydrate('missing');
      return;
    }
    let cancelled = false;
    setDetailHydrate('pending');
    resolveClientProductForDetail(apiToken, idTrimmed)
      .then((r) => {
        if (cancelled) return;
        if (r?.kind === 'catalog') {
          setSelectedCatalogProduct(r.product);
          setSelectedPurchase(null);
          setDetailHydrate('ready');
        } else if (r?.kind === 'purchase') {
          setSelectedPurchase(r.purchase);
          setSelectedCatalogProduct(null);
          setDetailHydrate('ready');
        } else {
          setDetailHydrate('missing');
        }
      })
      .catch(() => {
        if (!cancelled) setDetailHydrate('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [
    apiToken,
    idTrimmed,
    hasProductContext,
    isFromPurchased,
    selectedCatalogProduct?.id,
    selectedPurchase?.product.id,
    setSelectedCatalogProduct,
    setSelectedPurchase,
  ]);

  const catalog = isFromCatalog ? selectedCatalogProduct : null;
  const hasProduct = Boolean(purchase || catalog);

  const showHydrateLoading = Boolean(
    idTrimmed && !hasProductContext && detailHydrate === 'pending'
  );
  const showHydrateMissing = Boolean(
    !idTrimmed || detailHydrate === 'missing' || (detailHydrate === 'ready' && !hasProduct)
  );

  const catalogWarehouseLabel = catalog != null ? t('warehouseDisplayCentral') : '';
  const catalogReviewsList = catalog?.reviews ?? [];
  const hasCatalogReviews = Boolean(catalog && catalogReviewsList.length > 0);
  const catalogReviewStats = useMemo(
    () => computeReviewStats(hasCatalogReviews ? catalogReviewsList : []),
    [catalogReviewsList, hasCatalogReviews]
  );
  const hideBuyerReviewsSection = Boolean(catalog && !hasCatalogReviews);
  const showHeaderReviewRow = Boolean(purchase || hasCatalogReviews);

  const title = purchase?.product.name ?? catalog?.name ?? '';
  const description =
    purchase?.product.description ?? (catalog != null ? (catalog.description ?? '') : '');
  const productImageUrl = purchase
    ? (purchase.product.primaryImage?.url ??
      purchase.product.images?.find((i) => i.isPrimary)?.url ??
      purchase.product.images?.[0]?.url ??
      '')
    : catalog
      ? (catalog.primaryImage?.url ??
        catalog.images?.find((i) => i.isPrimary)?.url ??
        catalog.images?.[0]?.url ??
        '')
      : '';

  const displayImages = productImageUrl ? [productImageUrl] : [PLACEHOLDER_IMAGE];
  const totalPrice =
    purchase != null ? `${purchase.totalPrice} Kč` : catalog != null ? `${catalog.price} Kč` : '';
  const priceLabel = purchase != null ? t('productPricePerProduct') : '';
  const sellerName = purchase?.seller.name ?? '';
  const sellerAvatar = purchase?.seller.avatarUrl;
  const locationText = purchase?.warehouse
    ? `${purchase.warehouse.name}${purchase.warehouse.location ? ` - ${purchase.warehouse.location}` : ''}`
    : '';
  const showSellerSection = purchase != null;

  const reviewParams = purchase
    ? `entityType=sale_log&entityId=${encodeURIComponent(purchase.purchaseId)}&entityName=${encodeURIComponent(title)}${productImageUrl ? `&entityImage=${encodeURIComponent(productImageUrl)}` : ''}`
    : '';

  useEffect(() => {
    return () => {
      setSelectedPurchase(null);
      setSelectedCatalogProduct(null);
    };
  }, [setSelectedPurchase, setSelectedCatalogProduct]);

  useEffect(() => {
    if (!apiToken || !purchase?.purchaseId) {
      setReviews([]);
      setReviewsTotal(null);
      setHasReviewed(false);
      return;
    }
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'sale_log', purchase.purchaseId, {
      page: 1,
      limit: 9999,
      includeOwn: true,
    })
      .then((data) => {
        setReviews(data.reviews);
        setReviewsTotal(data.pagination.total);
        setHasReviewed(!!data.hasReviewed);
      })
      .catch(() => {
        setReviews([]);
        setReviewsTotal(null);
        setHasReviewed(false);
      })
      .finally(() => setLoadingReviews(false));
  }, [apiToken, purchase?.purchaseId]);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      if (apiToken && purchase?.purchaseId) {
        getEntityReviews(apiToken, 'sale_log', purchase.purchaseId, {
          page: 1,
          limit: 9999,
          includeOwn: true,
        })
          .then((data) => {
            setReviews(data.reviews);
            setReviewsTotal(data.pagination.total);
            setHasReviewed(!!data.hasReviewed);
          })
          .catch(() => {});
      }
      return () => {
        setIsFocused(false);
      };
    }, [apiToken, purchase?.purchaseId])
  );

  const { average, total: reviewsComputedTotal } = computeReviewStats(reviews);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;
  const headerReview = productDetailHeaderReviewSummary({
    purchase,
    hasCatalogReviews,
    catalogReviewStats,
    reviewsAverage: average,
    displayTotal,
    t,
  });

  const scrollRef = useRef<ScrollView>(null);
  const roundedViewYRef = useRef(0);
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const reviewsSectionYInRoundedRef = useRef(0);
  const scrollToReviews = useCallback(() => {
    const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  if (showHydrateLoading) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton title="" />
        <View className="flex-1 items-center justify-center px-global">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (showHydrateMissing) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton title="" />
        <View className="flex-1 items-center justify-center gap-4 px-global">
          <ThemedText className="text-center text-base text-light-text dark:text-dark-text">
            {t('productDetailNotFound')}
          </ThemedText>
          <Button
            title={t('commonBack')}
            variant="outline"
            onPress={() => router.back()}
            rounded="lg"
          />
        </View>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      const message = buildProductShareMessage({
        t,
        catalogWarehouseLabel,
        catalog,
        purchase,
        productTitle: title,
        totalPriceLabel:
          purchase != null ? `${totalPrice} ${t('productPricePerProduct')}` : totalPrice,
        primaryImageUrl: productImageUrl || undefined,
      });
      await Share.share({ message, title: t('productShareDialogTitle') });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const productIdForFavorite = purchase?.product.id ?? catalog?.id ?? productId ?? '';
  const rightComponents = [
    <Favorite
      key="fav"
      productName={title}
      title={title}
      entityType="product"
      entityId={productIdForFavorite}
      size={25}
      isWhite
    />,
    <HeaderIcon key="share" icon="Share2" onPress={handleShare} isWhite href="0" />,
  ];

  return (
    <>
      {isFocused && <StatusBar style="light" translucent />}
      <Header variant="transparent" title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        ref={scrollRef}
        className="bg-light-primary px-0 dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <ImageCarousel
          images={displayImages}
          height={500}
          paginationStyle="dots"
          scrollY={heroScrollY}
          stretchOnPullDown
        />

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="-mt-[30px] bg-light-primary p-global dark:bg-dark-primary"
          onLayout={(e: LayoutChangeEvent) => {
            roundedViewYRef.current = e.nativeEvent.layout.y;
          }}>
          {catalog && (!catalog.inStock || catalog.totalStock <= 0) ? (
            <View className="mb-4 items-center justify-center rounded-xl bg-red-500 px-3 py-3 dark:bg-red-600">
              <ThemedText variant="label" className="tracking-wide text-white">
                {t('productsCatalogOutOfStockBadge')}
              </ThemedText>
            </View>
          ) : null}
          <View>
            <ThemedText variant="h1" className="text-center">{title}</ThemedText>
            {showHeaderReviewRow ? (
              <View className="mt-4 flex-row items-center justify-center">
                <Pressable
                  onPress={scrollToReviews}
                  className="flex-row items-center active:opacity-70">
                  <ShowRating
                    rating={headerReview.rating}
                    size="lg"
                    className="border-r border-neutral-200 px-4 py-2 dark:border-dark-secondary"
                  />
                  <ThemedText className="px-4 text-base">{headerReview.label}</ThemedText>
                </Pressable>
                {purchase ? (
                  <Pressable
                    onPress={() => router.push(`/screens/review?${reviewParams}`)}
                    className="ml-4 rounded-lg bg-light-secondary px-3 py-2 dark:bg-dark-secondary">
                    <ThemedText variant="bodySm">
                      {hasReviewed ? t('reviewUpdate') : t('productRecenzovat')}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          {showSellerSection ? (
            <View className="mb-8 mt-8 flex-row items-center border-y border-neutral-200 py-global dark:border-dark-secondary">
              <Avatar
                size="md"
                src={sellerAvatar ?? undefined}
                name={sellerName}
                className="mr-4"
              />
              <View className="ml-0">
                <ThemedText variant="emphasis">
                  {t('productSeller')}: {sellerName}
                </ThemedText>
                <View className="flex-row items-center">
                  <Icon name="MapPin" size={12} className="mr-1" />
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {locationText}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : null}

          <ThemedText className={`text-base ${!showSellerSection ? 'mt-2' : ''}`}>
            {description}
          </ThemedText>

          <Divider className="mb-4 mt-8" />

          <Section title={t('productDetails')} titleSize="lg" className="mb-6 mt-2">
            <View className="mt-3">
              {catalog ? (
                <ProductCatalogDetailsSection
                  catalog={catalog}
                  catalogWarehouseLabel={catalogWarehouseLabel}
                  t={t}
                />
              ) : purchase ? (
                <ProductPurchaseDetailsSection purchase={purchase} locale={locale} t={t} />
              ) : null}
            </View>
          </Section>

          <Divider className="my-4" />

          {!hideBuyerReviewsSection ? (
            <ProductDetailReviewsSection
              purchase={purchase}
              catalogReviewsList={catalogReviewsList}
              hasCatalogReviews={hasCatalogReviews}
              reviews={reviews}
              reviewsTotal={reviewsTotal}
              loadingReviews={loadingReviews}
              hasReviewed={hasReviewed}
              reviewParams={reviewParams}
              clientId={client?.id}
              locale={locale}
              onLayout={(e) => {
                reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y;
              }}
              t={t}
            />
          ) : null}
        </View>
      </ThemedScroller>

      <ProductDetailBottomBar
        totalPrice={totalPrice}
        priceLabel={priceLabel}
        buttonTitle={t('productBuy')}
        buttonHref="/screens/product-purchase-info"
        paddingBottom={insets.bottom}
      />
    </>
  );
};

export default PropertyDetail;
