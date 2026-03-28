import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useState, useEffect } from 'react';
import { View, Animated, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { shadowPresets } from '@/utils/useShadow';
import { ScrollContext } from './_layout';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSetSelectedCatalogProduct, useSetSelectedPurchase } from '@/app/contexts/SelectedPurchaseContext';
import {
  CLIENT_PRODUCTS_GIFTS_FLAG_ID,
  getClientProducts,
  getClientProductsByFlag,
  type ClientCatalogProduct,
  type ClientProductPurchase,
} from '@/api/products';
import type { TranslationKey } from '@/locales';
import { useTranslation } from '@/app/hooks/useTranslation';

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
  const [purchasedLoading, setPurchasedLoading] = useState(true);
  const [purchasedProducts, setPurchasedProducts] = useState<ClientProductPurchase[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState<ClientCatalogProduct[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
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
      setPurchasedLoading(false);
      return;
    }
    setPurchasedLoading(true);
    getClientProducts(apiToken)
      .then((res) => setPurchasedProducts(res.products ?? []))
      .catch(() => setPurchasedProducts([]))
      .finally(() => setPurchasedLoading(false));
  }, [apiToken]);

  useEffect(() => {
    if (!apiToken) {
      setCatalogLoading(false);
      setCatalogProducts([]);
      return;
    }
    setCatalogLoading(true);
    getClientProductsByFlag(apiToken)
      .then((res) => setCatalogProducts(shuffled(res.products ?? [])))
      .catch(() => setCatalogProducts([]))
      .finally(() => setCatalogLoading(false));
  }, [apiToken]);

  useEffect(() => {
    if (!apiToken) {
      setGiftsLoading(false);
      setGiftProducts([]);
      return;
    }
    setGiftsLoading(true);
    getClientProductsByFlag(apiToken, { flagId: CLIENT_PRODUCTS_GIFTS_FLAG_ID })
      .then((res) => setGiftProducts(shuffled(res.products ?? [])))
      .catch(() => setGiftProducts([]))
      .finally(() => setGiftsLoading(false));
  }, [apiToken]);

  const renderFlagCatalogCards = (loading: boolean, items: ClientCatalogProduct[], emptyKey: TranslationKey) => {
    if (loading) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" />
          <ThemedText className="py-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      );
    }
    if (items.length === 0) {
      return (
        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">{t(emptyKey)}</ThemedText>
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
              <View className="px-2 py-1.5 rounded-lg bg-red-500 dark:bg-red-600 shadow-sm">
                <ThemedText className="text-[10px] font-bold text-white text-center leading-tight">
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
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        <Section title={t('productsMyPurchased')} titleSize="lg" className="mb-2">
          <CardScroller space={15} className="mt-1.5 pb-2">
            {purchasedLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" />
                <ThemedText className="py-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
              </View>
            ) : purchasedProducts.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">{t('productsNoPurchased')}</ThemedText>
            ) : (
              purchasedProducts.map((purchase) => {
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
              })
            )}
          </CardScroller>
        </Section>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-global mb-6"
          contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24, paddingTop: 8, paddingBottom: 18 }}
        >
          {[
            { titleKey: 'productsPromoTitle', subtitleKey: 'productsPromoSubtitle' },
            { titleKey: 'productsPromoTitle2', subtitleKey: 'productsPromoSubtitle2' },
            { titleKey: 'productsPromoTitle3', subtitleKey: 'productsPromoSubtitle3' },
            { titleKey: 'productsPromoTitle4', subtitleKey: 'productsPromoSubtitle4' },
            { titleKey: 'productsPromoTitle5', subtitleKey: 'productsPromoSubtitle5' },
          ]
            .map((item, index) => ({ item, index }))
            .filter(({ index }) => !dismissedPromoAt[index] || Date.now() - dismissedPromoAt[index] >= PROMO_HIDE_MS)
            .map(({ item, index }) => (
              <View
                key={index}
                style={{ ...shadowPresets.large, width: 280, marginRight: 15 }}
                className="p-5 rounded-2xl bg-light-secondary dark:bg-dark-secondary flex-shrink-0"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">{t(item.titleKey)}</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                      {t(item.subtitleKey)}
                    </ThemedText>
                  </View>
                  <Pressable className="p-1" onPress={() => handleDismissPromo(index)}>
                    <Icon name="X" size={18} className="text-light-subtext dark:text-dark-subtext" />
                  </Pressable>
                </View>
              </View>
            ))}
        </ScrollView>

        <Section title={t('productsTitle')} titleSize="lg" link="/screens/map" linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {renderFlagCatalogCards(catalogLoading, catalogProducts, 'productsCatalogEmpty')}
          </CardScroller>
        </Section>

        <Section title={t('productsGiftsTitle')} titleSize="lg" link="/screens/map" linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {renderFlagCatalogCards(giftsLoading, giftProducts, 'productsGiftsEmpty')}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ProductsScreen;
