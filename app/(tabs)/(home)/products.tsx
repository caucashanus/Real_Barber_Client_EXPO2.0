import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useState } from 'react';
import { Animated } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { ScrollContext } from './_layout';

const MOCK_PRODUCTS = [
  { id: '1', title: 'Hair wax', price: '199 Kč', image: require('@/assets/img/room-1.avif') },
  { id: '2', title: 'Styling gel', price: '149 Kč', image: require('@/assets/img/room-2.avif') },
  { id: '3', title: 'Shampoo', price: '279 Kč', image: require('@/assets/img/room-3.avif') },
  { id: '4', title: 'Beard oil', price: '349 Kč', image: require('@/assets/img/room-4.avif') },
];

const ProductsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const [loading] = useState(false);

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        <Section title="Products" titleSize="lg" link="/screens/map" linkText="View all">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {loading ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
            ) : (
              MOCK_PRODUCTS.map((item) => (
                <Card
                  key={item.id}
                  title={item.title}
                  rounded="2xl"
                  price={item.price}
                  width={160}
                  imageHeight={160}
                  image={item.image}
                  href="/screens/product-detail"
                />
              ))
            )}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ProductsScreen;
