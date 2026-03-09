import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useState, useEffect } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { ScrollContext } from './_layout';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSetSelectedPurchase } from '@/app/contexts/SelectedPurchaseContext';
import { getClientProducts, type ClientProductPurchase } from '@/api/products';
import { useTranslation } from '@/app/hooks/useTranslation';

const MOCK_PRODUCTS = [
  { id: '1', title: 'Hair wax', price: '199 Kč', image: require('@/assets/img/room-1.avif') },
  { id: '2', title: 'Styling gel', price: '149 Kč', image: require('@/assets/img/room-2.avif') },
  { id: '3', title: 'Shampoo', price: '279 Kč', image: require('@/assets/img/room-3.avif') },
  { id: '4', title: 'Beard oil', price: '349 Kč', image: require('@/assets/img/room-4.avif') },
];

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
        <Section title={t('productsMyPurchased')} titleSize="lg" className="mb-6">
          <CardScroller space={15} className="mt-1.5 pb-4">
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
                    image={imgUrl || require('@/assets/img/room-1.avif')}
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
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ProductsScreen;
