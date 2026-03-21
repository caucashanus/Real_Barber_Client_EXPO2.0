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
import { useSetSelectedPurchase } from '@/app/contexts/SelectedPurchaseContext';
import { getClientProducts, type ClientProductPurchase } from '@/api/products';
import { useTranslation } from '@/app/hooks/useTranslation';

const MOCK_PRODUCTS = [
  { id: '1', title: 'Hair wax', price: '199 Kč', image: require('@/assets/img/barbers.png') },
  { id: '2', title: 'Styling gel', price: '149 Kč', image: require('@/assets/img/barbers.png') },
  { id: '3', title: 'Shampoo', price: '279 Kč', image: require('@/assets/img/barbers.png') },
  { id: '4', title: 'Beard oil', price: '349 Kč', image: require('@/assets/img/barbers.png') },
];

const PROMO_DISMISSED_KEY = 'products_promo_dismissed';
const PROMO_HIDE_MS = 24 * 60 * 60 * 1000; // 24 h

/** Produkty: horizontální promo pás (široké karty). Nastav na `true`, až bude znovu potřeba. */
const SHOW_PRODUCTS_PROMO_STRIP = false;

/** Produkty: spodní řádek katalogu (mock CardScroller). Nastav na `true`, až bude znovu potřeba. */
const SHOW_PRODUCTS_CATALOG_CAROUSEL = false;

function productImageUrl(purchase: ClientProductPurchase): string {
  const url = purchase.product.primaryImage?.url ?? purchase.product.images?.[0]?.url;
  return url ?? '';
}

const ProductsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const router = useRouter();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const setSelectedPurchase = useSetSelectedPurchase();
  const [purchasedLoading, setPurchasedLoading] = useState(true);
  const [purchasedProducts, setPurchasedProducts] = useState<ClientProductPurchase[]>([]);
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
                      setSelectedPurchase(purchase);
                      router.push(`/screens/product-detail?id=${purchase.product.id}`);
                    }}
                  />
                );
              })
            )}
          </CardScroller>
        </Section>

        {SHOW_PRODUCTS_PROMO_STRIP ? (
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
        ) : null}

        {SHOW_PRODUCTS_CATALOG_CAROUSEL ? (
          <Section title={t('productsTitle')} titleSize="lg" link="/screens/map" linkText={t('commonViewAll')}>
            <CardScroller space={15} className="mt-1.5 pb-4">
              {MOCK_PRODUCTS.map((item) => (
                <Card
                  key={item.id}
                  title={item.title}
                  rounded="2xl"
                  price={item.price}
                  hasFavorite
                  favoriteEntityType="product"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={item.image}
                  href="/screens/product-detail"
                />
              ))}
            </CardScroller>
          </Section>
        ) : null}
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ProductsScreen;
