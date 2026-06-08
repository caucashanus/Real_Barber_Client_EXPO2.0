import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useState, useEffect } from 'react';
import { View, Animated, ActivityIndicator, Pressable, ScrollView } from 'react-native';

import { ScrollContext } from './_layout';

import {
  CLIENT_PRODUCTS_GIFTS_FLAG_ID,
  getClientProducts,
  getClientProductsByFlag,
  type ClientCatalogProduct,
  type ClientProductPurchase,
} from '@/api/products';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  useSetSelectedCatalogProduct,
  useSetSelectedPurchase,
} from '@/app/contexts/SelectedPurchaseContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { shadowPresets } from '@/utils/useShadow';

function catalogProductImageUrl(product: ClientCatalogProduct): string {
  return product.primaryImage?.url ?? product.images?.[0]?.url ?? '';
}

const PROMO_DISMISSED_KEY = 'products_promo_dismissed';
const PROMO_HIDE_MS = 24 * 60 * 60 * 1000; // 24 h

function productImageUrl(purchase: ClientProductPurchase): string {
  const url = purchase.product.primaryImage?.url ?? purchase.product.images?.[0]?.url;
  return url ?? '';
}

/** Náhodné pořadí (Fisher–Yates), nová kopie pole. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const ProductsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const router = useRouter();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const setSelectedPurchase = useSetSelectedPurchase();
  const setSelectedCatalogProduct = useSetSelectedCatalogProduct();
  const [loading, setLoading] = useState(!!apiToken);
  const [purchasedProducts, setPurchasedProducts] = useState<ClientProductPurchase[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ClientCatalogProduct[]>([]);
  const [giftProducts, setGiftProducts] = useState<ClientCatalogProduct[]>([]);
  const [dismissedPromoAt, setDismissedPromoAt] = useState<Record<number, number>>({});

  useEffect(() => {
    AsyncStorage.getItem(PROMO_DISMISSED_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed: Record<string, number> = JSON.parse(raw);
        const now = Date.now();
        const next: Record<number, number> = {};
        Object.entries(parsed).forEach(([k, ts]) => {
          const idx = Number(k);
          if (now - ts < PROMO_HIDE_MS) next[idx] = ts;
        });
        setDismissedPromoAt(next);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const handleDismissPromo = (index: number) => {
    const now = Date.now();
    setDismissedPromoAt((prev) => {
      const next = { ...prev, [index]: now };
      AsyncStorage.setItem(PROMO_DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  useEffect(() => {
    if (!apiToken) {
      setPurchasedProducts([]);
      setCatalogProducts([]);
      setGiftProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      getClientProducts(apiToken).catch(() => ({ products: [] as ClientProductPurchase[] })),
      getClientProductsByFlag(apiToken).catch(() => ({ products: [] as ClientCatalogProduct[] })),
      getClientProductsByFlag(apiToken, { flagId: CLIENT_PRODUCTS_GIFTS_FLAG_ID }).catch(() => ({
        products: [] as ClientCatalogProduct[],
      })),
    ])
      .then(([purchasedRes, catalogRes, giftsRes]) => {
        if (cancelled) return;
        setPurchasedProducts(purchasedRes.products ?? []);
        setCatalogProducts(shuffled(catalogRes.products ?? []));
        setGiftProducts(shuffled(giftsRes.products ?? []));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiToken]);

  const renderFlagCatalogCards = (items: ClientCatalogProduct[], emptyKey: TranslationKey) => {
    if (items.length === 0) {
      return (
        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
          {t(emptyKey)}
        </ThemedText>
      );
    }
    return items.map((item) => {
      const imgUrl = catalogProductImageUrl(item);
      const catalogOutOfStock = !item.inStock || item.totalStock <= 0;
      return (
        <Card
          key={item.id}
          title={item.name}
          rounded="2xl"
          price={`${item.price} Kč`}
          topLeftBadge={
            catalogOutOfStock ? (
              <View className="rounded-lg bg-red-500 px-2 py-1.5 shadow-sm dark:bg-red-600">
                <ThemedText className="text-center text-[10px] font-bold leading-tight text-white">
                  {t('productsCatalogOutOfStockBadge')}
                </ThemedText>
              </View>
            ) : undefined
          }
          hasFavorite
          favoriteEntityType="product"
          favoriteEntityId={item.id}
          width={160}
          imageHeight={160}
          image={imgUrl || require('@/assets/img/barbers.png')}
          onPress={() => {
            setSelectedPurchase(null);
            setSelectedCatalogProduct(item);
            router.push(`/screens/product-detail?id=${item.id}`);
          }}
        />
      );
    });
  };

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      {loading ? (
        <View className="min-h-[240px] flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      ) : (
        <AnimatedView animation="scaleIn" className="mt-4 flex-1">
          <Section title={t('productsMyPurchased')} titleSize="lg" className="mb-2">
            {purchasedProducts.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('productsNoPurchased')}
              </ThemedText>
            ) : (
              <CardScroller space={15} className="mt-1.5 pb-2">
                {purchasedProducts.map((purchase) => {
                  const imgUrl = productImageUrl(purchase);
                  return (
                    <Card
                      key={purchase.purchaseId}
                      title={purchase.product.name}
                      rounded="2xl"
                      price={`${purchase.totalPrice} Kč`}
                      badgeSecondary={purchase.paymentMethod}
                      hasFavorite
                      favoriteEntityType="product"
                      favoriteEntityId={purchase.product.id}
                      width={160}
                      imageHeight={160}
                      image={imgUrl || require('@/assets/img/barbers.png')}
                      onPress={() => {
                        setSelectedCatalogProduct(null);
                        setSelectedPurchase(purchase);
                        router.push(`/screens/product-detail?id=${purchase.product.id}`);
                      }}
                    />
                  );
                })}
              </CardScroller>
            )}
          </Section>

          {/* Promo cards hidden */}
          {false && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-global mb-6"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingRight: 24,
                paddingTop: 8,
                paddingBottom: 18,
              }}>
              {(
                [
                  { titleKey: 'productsPromoTitle', subtitleKey: 'productsPromoSubtitle' },
                  { titleKey: 'productsPromoTitle2', subtitleKey: 'productsPromoSubtitle2' },
                  { titleKey: 'productsPromoTitle3', subtitleKey: 'productsPromoSubtitle3' },
                  { titleKey: 'productsPromoTitle4', subtitleKey: 'productsPromoSubtitle4' },
                  { titleKey: 'productsPromoTitle5', subtitleKey: 'productsPromoSubtitle5' },
                ] as { titleKey: TranslationKey; subtitleKey: TranslationKey }[]
              )
                .map((item, index) => ({ item, index }))
                .filter(
                  ({ index }) =>
                    !dismissedPromoAt[index] ||
                    Date.now() - dismissedPromoAt[index] >= PROMO_HIDE_MS
                )
                .map(({ item, index }) => (
                  <View
                    key={index}
                    style={{ ...shadowPresets.large, width: 280, marginRight: 15 }}
                    className="flex-shrink-0 rounded-2xl bg-light-secondary p-5 dark:bg-dark-secondary">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">
                          {t(item.titleKey)}
                        </ThemedText>
                        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                          {t(item.subtitleKey)}
                        </ThemedText>
                      </View>
                      <Pressable className="p-1" onPress={() => handleDismissPromo(index)}>
                        <Icon
                          name="X"
                          size={18}
                          className="text-light-subtext dark:text-dark-subtext"
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
            </ScrollView>
          )}

          <Section
            title={t('productsTitle')}
            titleSize="lg"
            link="/screens/map"
            linkText={t('commonViewAll')}>
            <CardScroller space={15} className="mt-1.5 pb-4">
              {renderFlagCatalogCards(catalogProducts, 'productsCatalogEmpty')}
            </CardScroller>
          </Section>

          <Section
            title={t('productsGiftsTitle')}
            titleSize="lg"
            link="/screens/map"
            linkText={t('commonViewAll')}>
            <CardScroller space={15} className="mt-1.5 pb-4">
              {renderFlagCatalogCards(giftProducts, 'productsGiftsEmpty')}
            </CardScroller>
          </Section>
        </AnimatedView>
      )}
    </ThemeScroller>
  );
};

export default ProductsScreen;
