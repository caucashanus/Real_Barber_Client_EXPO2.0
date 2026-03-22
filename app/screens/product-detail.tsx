import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Animated, type LayoutChangeEvent } from 'react-native';
import { Share } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import ThemedScroller from '@/components/ThemeScroller';
import ImageCarousel from '@/components/ImageCarousel';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { CardScroller } from '@/components/CardScroller';
import Section from '@/components/layout/Section';
import Favorite from '@/components/Favorite';
import Divider from '@/components/layout/Divider';
import ShowRating from '@/components/ShowRating';
import Icon, { IconName } from '@/components/Icon';
import Switch from '@/components/forms/Switch';
import Avatar from '@/components/Avatar';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import {
    useSelectedCatalogProduct,
    useSelectedPurchase,
    useSetSelectedCatalogProduct,
    useSetSelectedPurchase,
} from '@/app/contexts/SelectedPurchaseContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import type { ClientCatalogProductReview } from '@/api/products';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { Locale } from '@/app/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import type { ClientProductPurchase } from '@/api/products';
import useThemeColors from '@/app/contexts/ThemeColors';
import {
    compareCatalogStockWarehouseRows,
    warehouseGeocodeQuery,
    warehouseUiName,
} from '@/utils/catalogWarehouse';

const property = {
    id: 1,
    title: 'Luxury Penthouse with Central Park View',
    description: 'Stunning penthouse apartment with breathtaking views of Central Park. This luxurious 3-bedroom home features floor-to-ceiling windows, a gourmet kitchen, and a private terrace. Perfect for families or groups looking for an upscale NYC experience.',
    price: '$850',
    features: {
        guests: '6 guests',
        bedrooms: '3 bedrooms',
        bathrooms: '2.5 bathrooms',
        size: '2,200 sq ft',
    },
    ratings: {
        overall: 4.9,
        cleanliness: 4.8,
        location: 5.0,
        value: 4.7,
        reviews: 284
    },
    host: {
        id: 101,
        name: 'John Doe',
        avatar: require('@/assets/img/wallet/RB.avatar.jpg'),
        location: 'Upper East Side, Manhattan, New York',
        joinedDate: 'January 2018'
    },
    images: [
        require('@/assets/img/barbers.png'),
        require('@/assets/img/barbers.png'),
        require('@/assets/img/barbers.png'),
        require('@/assets/img/barbers.png')
    ],
};

const reviewsData = [
    {
        rating: 5,
        description: "Amazing views and perfect location. The apartment was spotless and Sarah was very responsive throughout our stay.",
        date: "June 2023",
        username: "John D.",
        avatar: "https://randomuser.me/api/portraits/men/44.jpg"
    },
    {
        rating: 5,
        description: "Luxurious apartment with everything you need. We especially loved the terrace and the Central Park views!",
        date: "May 2023",
        username: "Maria S.",
        avatar: "https://randomuser.me/api/portraits/women/45.jpg"
    },
    {
        rating: 4,
        description: "Great experience overall. The kitchen was well-equipped and the beds were very comfortable. Highly recommend!",
        date: "April 2023",
        username: "David L.",
        avatar: "https://randomuser.me/api/portraits/men/63.jpg"
    },
    {
        rating: 5,
        description: "Perfect location for exploring NYC. The apartment exceeded our expectations and Sarah was an excellent host.",
        date: "March 2023",
        username: "Jennifer K.",
        avatar: "https://randomuser.me/api/portraits/women/67.jpg"
    }
];

function formatReviewDate(iso: string): string {
    try {
        const d = new Date(iso);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
        return iso;
    }
}

function formatPurchaseDate(iso: string, locale: Locale): string {
    try {
        const d = new Date(iso);
        if (locale === 'cs') {
            return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
}

function purchasePaymentMethodLabel(
    method: string | undefined,
    t: (key: TranslationKey) => string
): string {
    if (!method) return '—';
    const normalized = method.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized === 'CASH') return t('paymentMethodCash');
    if (normalized === 'CARD' || normalized === 'CREDIT_CARD' || normalized === 'DEBIT_CARD') return t('paymentMethodCard');
    if (normalized === 'RBC' || normalized === 'RB_COINS' || normalized === 'RBCOINS') return t('paymentMethodRbc');
    return method
        .split('_')
        .map((part) => (part.toLowerCase() === 'rbc' ? 'RBC' : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
        .join(' ');
}

function purchasePaymentBreakdownRows(purchase: ClientProductPurchase): boolean {
    const n = [purchase.totalCash, purchase.totalCard, purchase.totalCoins].filter((v) => v > 0).length;
    return n > 1;
}

function purchaseHasCashbackFields(purchase: ClientProductPurchase): boolean {
    return purchase.cashbackAmount != null || purchase.cashbackPaid != null;
}

const EMPTY_RATING_ROWS: ReadonlyArray<{ rating: number }> = [];

function useReviewStats(reviews: ReadonlyArray<{ rating: number }>) {
    return React.useMemo(() => {
        const countByRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const r of reviews) {
            const rating = Math.min(5, Math.max(1, Math.round(r.rating) || 0));
            countByRating[rating] = (countByRating[rating] ?? 0) + 1;
            sum += r.rating;
        }
        const total = reviews.length;
        const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
        return { countByRating, average, total };
    }, [reviews]);
}

function catalogReviewDisplayName(
    review: ClientCatalogProductReview,
    anonymousLabel: string
): string {
    if (review.isAnonymous) return anonymousLabel;
    const a = review.author;
    if (!a) return anonymousLabel;
    const named = a.name?.trim();
    if (named) return named;
    const parts = [a.firstName, a.lastName].filter(Boolean);
    const joined = parts.join(' ').trim();
    return joined || anonymousLabel;
}

function catalogReviewBody(review: ClientCatalogProductReview): string {
    const d = review.description?.trim();
    if (d) return d;
    const p = review.positiveFeedback?.trim();
    if (p) return p;
    const n = review.negativeFeedback?.trim();
    if (n) return n;
    return '—';
}

const similarProperties = [
    {
        id: 2,
        title: "Modern Loft in SoHo",
        price: "$650/night",
        image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
        id: 3,
        title: "Brooklyn Heights Apartment",
        price: "$450/night",
        image: 'https://images.pexels.com/photos/1571457/pexels-photo-1571457.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
        id: 4,
        title: "Midtown Studio",
        price: "$380/night",
        image: 'https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
        id: 5,
        title: "Chelsea Townhouse",
        price: "$950/night",
        image: 'https://images.pexels.com/photos/1571472/pexels-photo-1571472.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
];

const PropertyDetail = () => {
    const { id: productId } = useLocalSearchParams<{ id?: string }>();
    const selectedPurchase = useSelectedPurchase();
    const setSelectedPurchase = useSetSelectedPurchase();
    const selectedCatalogProduct = useSelectedCatalogProduct();
    const setSelectedCatalogProduct = useSetSelectedCatalogProduct();
    const { apiToken, client } = useAuth();
    const { t, locale } = useTranslation();
    const colors = useThemeColors();
    const [instantBook, setInstantBook] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
    const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const actionSheetRef = useRef<ActionSheetRef>(null);
    const insets = useSafeAreaInsets();

    const isFromPurchased = Boolean(productId && selectedPurchase && selectedPurchase.product.id === productId);
    const purchase = isFromPurchased ? selectedPurchase : null;
    const isFromCatalog = Boolean(
        productId && !purchase && selectedCatalogProduct && selectedCatalogProduct.id === productId
    );
    const catalog = isFromCatalog ? selectedCatalogProduct : null;
    const catalogWarehouseLabel = catalog != null ? t('warehouseDisplayCentral') : '';
    const catalogReviewsList = catalog?.reviews ?? [];
    const hasCatalogReviews = Boolean(catalog && catalogReviewsList.length > 0);
    const catalogReviewStats = useReviewStats(hasCatalogReviews ? catalogReviewsList : EMPTY_RATING_ROWS);
    const hideBuyerReviewsSection = Boolean(catalog && !hasCatalogReviews);
    const showHeaderReviewRow = !hideBuyerReviewsSection;

    const title = purchase?.product.name ?? catalog?.name ?? property.title;
    const description =
        purchase?.product.description ??
        (catalog != null ? (catalog.description ?? '') : property.description);
    const images = purchase
        ? (purchase.product.images?.length
            ? purchase.product.images.map((img) => img.url)
            : purchase.product.primaryImage
                ? [purchase.product.primaryImage.url]
                : [])
        : catalog
          ? (catalog.images?.length
              ? catalog.images.map((img) => img.url)
              : catalog.primaryImage
                ? [catalog.primaryImage.url]
                : [])
          : property.images;
    const displayImages = images.length > 0 ? images : [require('@/assets/img/barbers.png')];
    const totalPrice =
        purchase != null ? `${purchase.totalPrice} Kč` : catalog != null ? `${catalog.price} Kč` : property.price;
    const priceLabel =
        purchase != null ? t('productPricePerProduct') : catalog != null ? '' : t('productPricePerNight');
    const sellerName = purchase?.seller.name ?? property.host.name;
    const sellerAvatar = purchase?.seller.avatarUrl ?? property.host.avatar;
    const locationText = purchase?.warehouse
        ? `${purchase.warehouse.name}${purchase.warehouse.location ? ` - ${purchase.warehouse.location}` : ''}`
        : property.host.location;
    /** Prodejce jen u skutečného nákupu; u katalogu bez nákupu neukazovat mock hostitele. */
    const showSellerSection = purchase != null || catalog == null;

    const productImageUrl = purchase
        ? (purchase.product.primaryImage?.url ?? purchase.product.images?.find((i) => i.isPrimary)?.url ?? purchase.product.images?.[0]?.url ?? '')
        : catalog
          ? (catalog.primaryImage?.url ??
              catalog.images?.find((i) => i.isPrimary)?.url ??
              catalog.images?.[0]?.url ??
              '')
          : '';

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
        getEntityReviews(apiToken, 'sale_log', purchase.purchaseId, { page: 1, limit: 9999, includeOwn: true })
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

    // Status bar and refetch reviews when screen gains focus (e.g. return from Write review)
    useFocusEffect(
        React.useCallback(() => {
            setIsFocused(true);
            if (apiToken && purchase?.purchaseId) {
                getEntityReviews(apiToken, 'sale_log', purchase.purchaseId, { page: 1, limit: 9999, includeOwn: true })
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

    const { countByRating, average, total: reviewsComputedTotal } = useReviewStats(reviews);
    const displayTotal = reviewsTotal ?? reviewsComputedTotal;

    const scrollRef = useRef<ScrollView>(null);
    const roundedViewYRef = useRef(0);
    const heroScrollY = useRef(new Animated.Value(0)).current;
    const reviewsSectionYInRoundedRef = useRef(0);
    const scrollToReviews = useCallback(() => {
        const y = roundedViewYRef.current + reviewsSectionYInRoundedRef.current;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }, []);

    const handleShare = async () => {
        try {
            const message =
                purchase != null
                    ? `${title}\n${t('productSharePrice')}: ${totalPrice} ${t('productPricePerProduct')}`
                    : catalog != null
                      ? `${title}\n${t('productSharePrice')}: ${totalPrice}`
                      : `Check out this amazing property: ${property.title}\n${t('productSharePrice')}: ${property.price} ${t('productPricePerNight')}`;
            await Share.share({ message, title });
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
            <Header variant='transparent' title="" rightComponents={rightComponents} showBackButton />
            <ThemedScroller
                ref={scrollRef}
                className="px-0 bg-light-primary dark:bg-dark-primary"
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
                    useNativeDriver: false,
                })}
                scrollEventThrottle={16}
            >
                <ImageCarousel
                    images={displayImages}
                    height={500}
                    paginationStyle="dots"
                    scrollY={heroScrollY}
                    stretchOnPullDown
                />

                <View
                    style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
                    className="p-global bg-light-primary dark:bg-dark-primary -mt-[30px]"
                    onLayout={(e: LayoutChangeEvent) => { roundedViewYRef.current = e.nativeEvent.layout.y; }}
                >
                    {catalog && (!catalog.inStock || catalog.totalStock <= 0) ? (
                        <View className="mb-4 py-3 px-3 rounded-xl bg-red-500 dark:bg-red-600 items-center justify-center">
                            <ThemedText className="text-sm font-bold text-white tracking-wide">
                                {t('productsCatalogOutOfStockBadge')}
                            </ThemedText>
                        </View>
                    ) : null}
                    <View className=''>
                        <ThemedText className="text-3xl text-center font-semibold">{title}</ThemedText>
                        {showHeaderReviewRow ? (
                            <View className='flex-row items-center justify-center mt-4'>
                                <Pressable onPress={scrollToReviews} className="flex-row items-center active:opacity-70">
                                    <ShowRating
                                        rating={
                                            purchase
                                                ? average
                                                : hasCatalogReviews
                                                  ? catalogReviewStats.average
                                                  : property.ratings.overall
                                        }
                                        size="lg"
                                        className='px-4 py-2 border-r border-neutral-200 dark:border-dark-secondary'
                                    />
                                    <ThemedText className="text-base px-4">
                                        {purchase
                                            ? `${displayTotal} Reviews`
                                            : hasCatalogReviews
                                              ? `${catalogReviewStats.total} ${t('productReviewsCount')}`
                                              : '234 Reviews'}
                                    </ThemedText>
                                </Pressable>
                                {purchase && (
                                    <Pressable
                                        onPress={() => router.push(`/screens/review?${reviewParams}`)}
                                        className="ml-4 px-3 py-2 rounded-lg bg-light-secondary dark:bg-dark-secondary"
                                    >
                                        <ThemedText className="text-sm font-medium">{hasReviewed ? t('reviewUpdate') : t('productRecenzovat')}</ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        ) : null}
                    </View>

                    {showSellerSection ? (
                        <View className="flex-row items-center mt-8 mb-8 py-global border-y border-neutral-200 dark:border-dark-secondary">
                            <Avatar
                                size="md"
                                src={sellerAvatar}
                                name={sellerName}
                                className="mr-4"
                                link={purchase ? undefined : `/screens/user-profile`}
                            />
                            <View className="ml-0">
                                <ThemedText className="font-semibold text-base">
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

                    <ThemedText className={`text-base ${!showSellerSection ? 'mt-2' : ''}`}>{description}</ThemedText>



                    <Divider className="mb-4 mt-8" />

                    {/* Property / Product Features */}
                    <Section title={t('productDetails')} titleSize="lg" className="mb-6 mt-2">
                        <View className="mt-3">
                            {catalog ? (
                                <>
                                    {catalog.flags && catalog.flags.length > 0 ? (
                                        <View className="py-4">
                                            <View className="flex-row items-start">
                                                <Icon
                                                    name="Tag"
                                                    size={24}
                                                    strokeWidth={1.5}
                                                    className="mr-3 mt-0.5 text-light-text dark:text-dark-text"
                                                />
                                                <View className="flex-1 min-w-0">
                                                    <ThemedText className="text-light-text dark:text-dark-text mb-2">
                                                        {t('productCatalogFlags')}
                                                    </ThemedText>
                                                    <View className="flex-row flex-wrap gap-2">
                                                        {[...catalog.flags]
                                                            .sort((a, b) =>
                                                                a.name.localeCompare(b.name, undefined, {
                                                                    sensitivity: 'base',
                                                                })
                                                            )
                                                            .map((f) => (
                                                            <View
                                                                key={f.id}
                                                                style={{
                                                                    backgroundColor: f.color?.trim() || '#737373',
                                                                }}
                                                                className="px-3 py-1.5 rounded-full"
                                                            >
                                                                <Text
                                                                    style={{
                                                                        color: '#ffffff',
                                                                        fontSize: 13,
                                                                        fontWeight: '600',
                                                                    }}
                                                                    numberOfLines={1}
                                                                >
                                                                    {f.name}
                                                                </Text>
                                                            </View>
                                                            ))}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ) : null}
                                    <FeatureItem
                                        icon="Package"
                                        label={t('productStock')}
                                        value={String(catalog.totalStock)}
                                    />
                                    <FeatureItem
                                        icon="CircleCheck"
                                        label={t('productAvailability')}
                                        value={
                                            catalog.inStock ? t('productsCatalogInStock') : t('productsCatalogOutOfStock')
                                        }
                                    />
                                    {catalog.stockByWarehouse && catalog.stockByWarehouse.length > 0 ? (
                                        <View className="mt-2 pt-4 border-t border-neutral-200 dark:border-dark-secondary">
                                            <ThemedText className="text-sm font-semibold mb-2 text-light-text dark:text-dark-text">
                                                {t('productStockByWarehouse')}
                                            </ThemedText>
                                            {[...catalog.stockByWarehouse]
                                                .sort((a, b) =>
                                                    compareCatalogStockWarehouseRows(a, b, catalogWarehouseLabel)
                                                )
                                                .map((row) => {
                                                    const whDisplayName = warehouseUiName(
                                                        row.warehouse.name,
                                                        catalogWarehouseLabel
                                                    );
                                                    const mapQuery = warehouseGeocodeQuery(row.warehouse, whDisplayName);
                                                    const canOpenMap = mapQuery.trim().length > 0;
                                                    const loc = row.warehouse.location?.trim();
                                                    const addr = row.warehouse.address?.trim();
                                                    const separateAddress = Boolean(addr && loc && addr !== loc);
                                                    const addressLineOnly = Boolean(addr && !loc);
                                                    const mapHintEl = canOpenMap ? (
                                                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext underline shrink-0">
                                                            {t('productWarehouseMapHint')}
                                                        </ThemedText>
                                                    ) : null;
                                                    return (
                                                        <View
                                                            key={row.warehouse.id}
                                                            className="flex-row justify-between items-start py-3 border-b border-neutral-100 dark:border-dark-secondary/60 last:border-b-0"
                                                        >
                                                            <Pressable
                                                                accessibilityRole="button"
                                                                accessibilityLabel={t('productWarehouseOpenMap')}
                                                                disabled={!canOpenMap}
                                                                onPress={() => {
                                                                    if (!canOpenMap) return;
                                                                    router.push(
                                                                        `/screens/map?mapQuery=${encodeURIComponent(mapQuery)}&mapLabel=${encodeURIComponent(whDisplayName)}`
                                                                    );
                                                                }}
                                                                className={`flex-1 pr-3 min-w-0 ${canOpenMap ? 'active:opacity-70' : ''}`}
                                                            >
                                                                <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
                                                                    {whDisplayName}
                                                                </ThemedText>
                                                                {loc && !separateAddress && !addressLineOnly ? (
                                                                    <View className="flex-row flex-wrap items-baseline gap-x-2 mt-0.5">
                                                                        <ThemedText
                                                                            className="text-xs text-light-subtext dark:text-dark-subtext min-w-0 shrink"
                                                                            numberOfLines={2}
                                                                        >
                                                                            {loc}
                                                                        </ThemedText>
                                                                        {mapHintEl}
                                                                    </View>
                                                                ) : null}
                                                                {loc && separateAddress ? (
                                                                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-0.5">
                                                                        {loc}
                                                                    </ThemedText>
                                                                ) : null}
                                                                {separateAddress || addressLineOnly ? (
                                                                    <View className="flex-row flex-wrap items-baseline gap-x-2 mt-0.5">
                                                                        <ThemedText
                                                                            className="text-xs text-light-subtext dark:text-dark-subtext min-w-0 shrink"
                                                                            numberOfLines={2}
                                                                        >
                                                                            {addr}
                                                                        </ThemedText>
                                                                        {mapHintEl}
                                                                    </View>
                                                                ) : null}
                                                            </Pressable>
                                                            <ThemedText className="text-sm font-semibold text-light-text dark:text-dark-text shrink-0">
                                                                {row.quantity} {t('productPiecesAbbr')}
                                                            </ThemedText>
                                                        </View>
                                                    );
                                                })}
                                        </View>
                                    ) : null}
                                </>
                            ) : purchase ? (
                                <>
                                    <FeatureItem
                                        icon="Calendar"
                                        label={t('productPurchaseDate')}
                                        value={formatPurchaseDate(purchase.purchaseDate, locale)}
                                    />
                                    <FeatureItem
                                        icon="CreditCard"
                                        label={t('checkoutPaymentMethod')}
                                        value={purchasePaymentMethodLabel(purchase.paymentMethod, t)}
                                    />
                                    <FeatureItem
                                        icon="Package"
                                        label={t('productPurchaseQuantity')}
                                        value={String(purchase.quantity)}
                                    />
                                    <FeatureItem
                                        icon="CircleDollarSign"
                                        label={t('productPurchaseUnitPrice')}
                                        value={`${purchase.unitPrice} Kč`}
                                    />
                                    <FeatureItem
                                        icon="Wallet"
                                        label={t('productPurchaseTotal')}
                                        value={`${purchase.totalPrice} Kč`}
                                    />
                                    {purchase.product.sku ? (
                                        <FeatureItem icon="Hash" label={t('productSku')} value={purchase.product.sku} />
                                    ) : null}
                                    {purchase.notes ? (
                                        <FeatureItem icon="StickyNote" label={t('productPurchaseNotes')} value={purchase.notes} />
                                    ) : null}
                                    {purchasePaymentBreakdownRows(purchase) ? (
                                        <>
                                            {purchase.totalCash > 0 ? (
                                                <FeatureItem
                                                    icon="Banknote"
                                                    label={t('paymentMethodCash')}
                                                    value={`${purchase.totalCash} Kč`}
                                                />
                                            ) : null}
                                            {purchase.totalCard > 0 ? (
                                                <FeatureItem
                                                    icon="CreditCard"
                                                    label={t('paymentMethodCard')}
                                                    value={`${purchase.totalCard} Kč`}
                                                />
                                            ) : null}
                                            {purchase.totalCoins > 0 ? (
                                                <FeatureItem
                                                    icon="Coins"
                                                    label={t('paymentMethodRbc')}
                                                    value={String(purchase.totalCoins)}
                                                />
                                            ) : null}
                                        </>
                                    ) : null}
                                    {purchaseHasCashbackFields(purchase) ? (
                                        <>
                                            {purchase.cashbackAmount != null ? (
                                                <FeatureItem
                                                    icon="Gift"
                                                    label={t('productPurchaseCashback')}
                                                    value={`${purchase.cashbackAmount} ${(purchase.cashbackUnit ?? 'RBC').trim()}`}
                                                />
                                            ) : null}
                                            {purchase.cashbackPaid != null ? (
                                                <FeatureItem
                                                    icon={purchase.cashbackPaid ? 'CircleCheck' : 'Clock'}
                                                    label={t('productPurchaseCashbackStatus')}
                                                    value={
                                                        purchase.cashbackPaid
                                                            ? t('productPurchaseCashbackPaid')
                                                            : t('productPurchaseCashbackPending')
                                                    }
                                                />
                                            ) : null}
                                        </>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <FeatureItem icon="Users" label={t('productGuests')} value={property.features.guests} />
                                    <FeatureItem icon="BedDouble" label={t('productBedrooms')} value={property.features.bedrooms} />
                                    <FeatureItem icon="Bath" label={t('productBathrooms')} value={property.features.bathrooms} />
                                    <FeatureItem icon="PencilRuler" label={t('productSize')} value={property.features.size} />
                                </>
                            )}
                        </View>
                    </Section>

                    <Divider className="my-4" />

                    {/* Instant Book Option */}
                    <View className="flex-row items-center justify-between">
                        <Switch
                            icon="Zap"
                            label={t('productInstantBook')}
                            description={t('productInstantBookDescription')}
                            value={instantBook}
                            onChange={setInstantBook}
                            className="flex-1 py-3"
                        />
                    </View>

                    <Divider className="my-4" />

                    {/* Ratings & Reviews (u katalogu bez recenzí sekci nezobrazujeme) */}
                    {!hideBuyerReviewsSection ? (
                    <View onLayout={(e: LayoutChangeEvent) => { reviewsSectionYInRoundedRef.current = e.nativeEvent.layout.y; }}>
                        <Section
                            title={t('productBuyerReviews')}
                            titleSize="lg"
                            subtitle={
                                purchase
                                    ? `${displayTotal} reviews`
                                    : hasCatalogReviews
                                      ? `${catalogReviewStats.total} ${t('productReviewsCount')}`
                                      : `${property.ratings.reviews} reviews`
                            }
                            className="mb-6"
                        >
                        {purchase ? (
                            <>
                                <View className="mt-4 bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                                    <View className="flex-row items-center mb-4">
                                        <ShowRating rating={average} size="lg" />
                                        <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                                            ({displayTotal})
                                        </ThemedText>
                                    </View>
                                    <View className="space-y-2">
                                        {([5, 4, 3, 2, 1] as const).map((stars) => (
                                            <View key={stars} className="flex-row items-center justify-between py-1.5">
                                                <ShowRating rating={stars} size="sm" displayMode="stars" />
                                                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                                                    {countByRating[stars] ?? 0} reviews
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View className="mt-6 flex-row items-center justify-between mb-3">
                                    <ThemedText className="font-semibold text-lg">{t('productBuyerReviews')}</ThemedText>
                                    <Pressable
                                        onPress={() => router.push(`/screens/review?${reviewParams}`)}
                                        className="px-3 py-2 rounded-lg bg-light-secondary dark:bg-dark-secondary"
                                    >
                                        <ThemedText className="text-sm font-medium">{hasReviewed ? t('reviewUpdate') : t('productNapsatRecenzi')}</ThemedText>
                                    </Pressable>
                                </View>
                                {loadingReviews ? (
                                    <View className="py-6 items-center">
                                        <ActivityIndicator size="small" />
                                        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">{t('branchLoadingReviews')}</ThemedText>
                                    </View>
                                ) : (
                                    <CardScroller className="mt-1" space={10}>
                                        {reviews.map((review) => {
                                            const isOwnReview = client?.id != null && review.client?.id === client.id;
                                            return (
                                                <View key={review.id} className="w-[280px] bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                                                    <View className="flex-row items-center justify-between mb-2">
                                                        <View className="flex-row items-center flex-1 min-w-0">
                                                            {review.client?.avatarUrl ? (
                                                                <Image source={{ uri: review.client.avatarUrl }} className="w-10 h-10 rounded-full mr-2" />
                                                            ) : (
                                                                <Avatar size="sm" name={review.client?.name ?? '?'} className="mr-2" />
                                                            )}
                                                            <View className="min-w-0">
                                                                <ThemedText className="font-medium" numberOfLines={1}>{review.client?.name ?? 'Anonymous'}</ThemedText>
                                                                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                                                    {formatReviewDate(review.createdAt)}
                                                                </ThemedText>
                                                            </View>
                                                        </View>
                                                        {isOwnReview && (
                                                            <View style={{ backgroundColor: colors.highlight }} className="ml-2 px-2 py-1 rounded-md">
                                                                <ThemedText className="text-xs font-medium text-white">{t('productEdit')}</ThemedText>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <ShowRating rating={review.rating} size="sm" className="mb-2" />
                                                    <ThemedText className="text-sm">
                                                        {review.description || review.positiveFeedback || '—'}
                                                    </ThemedText>
                                                </View>
                                            );
                                        })}
                                    </CardScroller>
                                )}
                            </>
                        ) : hasCatalogReviews ? (
                            <>
                                <View className="mt-4 bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                                    <View className="flex-row items-center mb-4">
                                        <ShowRating rating={catalogReviewStats.average} size="lg" />
                                        <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                                            ({catalogReviewStats.total})
                                        </ThemedText>
                                    </View>
                                    <View className="space-y-2">
                                        {([5, 4, 3, 2, 1] as const).map((stars) => (
                                            <View key={stars} className="flex-row items-center justify-between py-1.5">
                                                <ShowRating rating={stars} size="sm" displayMode="stars" />
                                                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                                                    {catalogReviewStats.countByRating[stars] ?? 0} reviews
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View className="mt-6 flex-row items-center justify-between mb-3">
                                    <ThemedText className="font-semibold text-lg">{t('productBuyerReviews')}</ThemedText>
                                </View>
                                <CardScroller className="mt-1" space={10}>
                                    {catalogReviewsList.map((review) => {
                                        const authorName = catalogReviewDisplayName(
                                            review,
                                            t('productReviewAuthorAnonymous')
                                        );
                                        const avatarUri = review.isAnonymous ? '' : review.author?.avatarUrl ?? '';
                                        return (
                                            <View
                                                key={review.id}
                                                className="w-[280px] bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg"
                                            >
                                                <View className="flex-row items-center mb-2">
                                                    {avatarUri ? (
                                                        <Image
                                                            source={{ uri: avatarUri }}
                                                            className="w-10 h-10 rounded-full mr-2"
                                                        />
                                                    ) : (
                                                        <Avatar size="sm" name={authorName} className="mr-2" />
                                                    )}
                                                    <View className="min-w-0 flex-1">
                                                        <ThemedText className="font-medium" numberOfLines={1}>
                                                            {authorName}
                                                        </ThemedText>
                                                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                                            {formatReviewDate(review.createdAt)}
                                                        </ThemedText>
                                                    </View>
                                                </View>
                                                <ShowRating rating={review.rating} size="sm" className="mb-2" />
                                                <ThemedText className="text-sm">{catalogReviewBody(review)}</ThemedText>
                                            </View>
                                        );
                                    })}
                                </CardScroller>
                            </>
                        ) : (
                            <>
                                <View className="mt-4 bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                                    <View className="flex-row items-center mb-4">
                                        <ShowRating rating={property.ratings.overall} size="lg" />
                                        <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">
                                            ({property.ratings.reviews})
                                        </ThemedText>
                                    </View>
                                    <View className="space-y-2">
                                        <RatingItem label={t('productCleanliness')} rating={property.ratings.cleanliness} />
                                        <RatingItem label={t('productLocation')} rating={property.ratings.location} />
                                        <RatingItem label={t('productValueForMoney')} rating={property.ratings.value} />
                                    </View>
                                </View>
                                <View className="mt-6 flex-row items-center justify-between mb-3">
                                    <ThemedText className="font-semibold text-lg">{t('productBuyerReviews')}</ThemedText>
                                </View>
                                <CardScroller className="mt-1" space={10}>
                                    {reviewsData.map((review, index) => (
                                        <View key={index} className="w-[280px] bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg">
                                            <View className="flex-row items-center mb-2">
                                                <Image
                                                    source={{ uri: review.avatar }}
                                                    className="w-10 h-10 rounded-full mr-2"
                                                />
                                                <View>
                                                    <ThemedText className="font-medium">{review.username}</ThemedText>
                                                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                                        {review.date}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                            <ShowRating rating={review.rating} size="sm" className="mb-2" />
                                            <ThemedText className="text-sm">{review.description}</ThemedText>
                                        </View>
                                    ))}
                                </CardScroller>
                            </>
                        )}

                        </Section>
                    </View>
                    ) : null}
                </View>
            </ThemedScroller>

            {/* Bottom Booking Bar */}

                    <View
                        style={{ paddingBottom: insets.bottom }}
                        className=' flex-row items-center justify-start px-global pt-4 border-t border-neutral-200 dark:border-dark-secondary'
                    >
                        <View>
                            <ThemedText className='text-xl font-bold'>
                                {totalPrice}
                                {priceLabel ? ` ${priceLabel}` : ''}
                            </ThemedText>
                            {!purchase && !catalog && (
                                <ThemedText className='text-xs opacity-60'>5 - 12 June</ThemedText>
                            )}
                        </View>
                        <View className='flex-row items-center ml-auto'>
                            <Button
                                title={purchase || catalog ? 'Buy' : 'Reserve'}
                                variant="primary" className="ml-6 px-6"
                                textClassName='text-white'
                                size='medium'
                                href='/screens/order-detail?id=1'
                                rounded='lg'
                            />
                        </View>
                    </View>
        </>
    );
};

// Feature Item Component
interface FeatureItemProps {
    icon: IconName;
    label: string;
    value: string;
}

const FeatureItem = ({ icon, label, value }: FeatureItemProps) => (
    <View className="flex-row items-center py-4">
        <Icon name={icon} size={24} strokeWidth={1.5} className="mr-3" />
        <ThemedText className="flex-1">{label}</ThemedText>
        <ThemedText className="font-medium">{value}</ThemedText>
    </View>
);

// Rating Item Component
interface RatingItemProps {
    label: string;
    rating: number;
}

const RatingItem = ({ label, rating }: RatingItemProps) => (
    <View className="flex-row items-center justify-between py-2">
        <ThemedText className="text-sm">{label}</ThemedText>
        <View className="flex-row items-center">
            <ShowRating rating={rating} size="sm" />
        </View>
    </View>
);

export default PropertyDetail;