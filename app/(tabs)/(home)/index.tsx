import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useEffect, useState } from 'react';
import { View, Pressable, Image, Animated } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import ThemedText from '@/components/ThemedText';
import useShadow, { shadowPresets } from '@/utils/useShadow';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBranches, type Branch, type BranchService } from '@/api/branches';

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

const MOCK_SECTIONS = [
  { title: "Trending in Prague", properties: [{ title: "Modern Cuts Vinohrady", image: require('@/assets/img/room-5.avif'), price: "from $18" }, { title: "Studio Barbershop Prague", image: require('@/assets/img/room-6.avif'), price: "from $16" }, { title: "Forest Hill Barbers", image: require('@/assets/img/room-7.avif'), price: "from $20" }, { title: "Flushing Style Prague", image: require('@/assets/img/room-1.avif'), price: "from $15" }] },
  { title: "Best rated in Prague", properties: [{ title: "Cozy Barbershop Riverdale", image: require('@/assets/img/room-2.avif'), price: "from $14" }, { title: "Riverdale Cuts", image: require('@/assets/img/room-3.avif'), price: "from $16" }, { title: "Mott Haven Barbers", image: require('@/assets/img/room-4.avif'), price: "from $18" }, { title: "Fordham Gentleman", image: require('@/assets/img/room-5.avif'), price: "from $17" }] },
  { title: "Top picks in Prague", properties: [{ title: "St. George Barbershop", image: require('@/assets/img/room-6.avif'), price: "from $22" }, { title: "George Street Cuts", image: require('@/assets/img/room-7.avif'), price: "from $18" }, { title: "Great Kills Barbers", image: require('@/assets/img/room-1.avif'), price: "from $20" }, { title: "Todt Hill Barbershop", image: require('@/assets/img/room-2.avif'), price: "from $24" }] },
  { title: "New listings in Prague", properties: [{ title: "Hamilton Barbershop", image: require('@/assets/img/room-3.avif'), price: "from $23" }, { title: "East Prague Studio", image: require('@/assets/img/room-4.avif'), price: "from $16" }, { title: "Sugar Hill Cuts", image: require('@/assets/img/room-5.avif'), price: "from $19" }, { title: "Manhattanville Barbers", image: require('@/assets/img/room-6.avif'), price: "from $21" }] },
  { title: "Featured in Prague", properties: [{ title: "Industrial Barbershop", image: require('@/assets/img/room-7.avif'), price: "from $26" }, { title: "Rooftop Cuts", image: require('@/assets/img/room-1.avif'), price: "from $23" }, { title: "Modern Studio Barbers", image: require('@/assets/img/room-2.avif'), price: "from $20" }, { title: "Warehouse Barbershop", image: require('@/assets/img/room-3.avif'), price: "from $24" }] },
];

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

function branchCardImage(branch: Branch): string | number {
  const mediaUrls = getMediaUrlsSorted(branch.media);
  if (mediaUrls.length > 0) return mediaUrls[0];
  if (branch.imageUrl) return branch.imageUrl;
  const servicesList = getServicesList(branch);
  const firstService = servicesList[0];
  if (firstService?.imageUrl) return firstService.imageUrl;
  return require('@/assets/img/room-1.avif');
}

function branchPrice(branch: Branch): string {
  const servicesList = getServicesList(branch);
  const prices = servicesList.map((s) => s.price).filter((p) => p != null);
  if (prices.length === 0) return '';
  const min = Math.min(...prices);
  return `from ${min} Kč`;
}

const HomeScreen = () => {
    const scrollY = useContext(ScrollContext);
    const { apiToken } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesError, setBranchesError] = useState<string | null>(null);

    useEffect(() => {
      if (!apiToken) return;
      setBranchesLoading(true);
      setBranchesError(null);
      getBranches(apiToken, { includeReviews: true, reviewsLimit: 1 })
        .then(setBranches)
        .catch((e) => setBranchesError(e instanceof Error ? e.message : 'Failed to load'))
        .finally(() => setBranchesLoading(false));
    }, [apiToken]);

    const popularBranches = branches.length > 0 ? branches : null;

    return (


        <ThemeScroller
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
            <AnimatedView animation="scaleIn" className='flex-1 mt-4'>
                <Pressable onPress={() => router.push('/screens/map')} style={{ ...shadowPresets.large }} className='p-5 mb-8 flex flex-row items-center rounded-2xl bg-light-primary dark:bg-dark-secondary'>
                    <ThemedText className='text-base font-medium flex-1 pr-2'>
                        Continue searching for barbershops in Prague
                    </ThemedText>
                    <View className='w-20 h-20 relative'>
                        <View className='w-full h-full rounded-xl relative z-20 overflow-hidden border-2 border-light-primary dark:border-dark-primary'>
                            <Image className='w-full h-full' source={{ uri: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?q=80&w=400' }} />
                        </View>
                        <View className='w-full h-full absolute top-0 left-1 rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary'>
                            <Image className='w-full h-full' source={{ uri: 'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200' }} />
                        </View>
                    </View>
                </Pressable>
                <Section title="Popular barbershops in Prague" titleSize="lg" link="/screens/map" linkText="View all">
                  <CardScroller space={15} className='mt-1.5 pb-4'>
                    {branchesLoading && (
                      <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading branches…</ThemedText>
                    )}
                    {branchesError && (
                      <ThemedText className="py-4 text-red-500 dark:text-red-400">{branchesError}</ThemedText>
                    )}
                    {popularBranches?.map((branch) => (
                      <Card
                        key={branch.id}
                        title={branch.name}
                        rounded="2xl"
                        hasFavorite
                        favoriteEntityType="branch"
                        favoriteEntityId={branch.id}
                        rating={4.5}
                        href={`/screens/branch-detail?id=${branch.id}`}
                        price={branchPrice(branch)}
                        width={160}
                        imageHeight={160}
                        image={branchCardImage(branch)}
                      />
                    ))}
                    {!apiToken && !popularBranches && (
                      <>
                        {[require('@/assets/img/room-1.avif'), require('@/assets/img/room-2.avif'), require('@/assets/img/room-3.avif'), require('@/assets/img/room-4.avif')].map((img, i) => (
                          <Card key={i} title={`Barbershop ${i + 1}`} rounded="2xl" hasFavorite rating={4.5} href="/screens/login" price="from 0 Kč" width={160} imageHeight={160} image={img} />
                        ))}
                      </>
                    )}
                  </CardScroller>
                </Section>

                {MOCK_SECTIONS.map((section, index) => (
                    <Section
                        key={`branches-section-${index}`}
                        title={section.title}
                        titleSize="lg"
                        link="/screens/map"
                        linkText="View all"
                    >
                        <CardScroller space={15} className='mt-1.5 pb-4'>
                            {section.properties.map((property, propIndex) => (
                                <Card
                                    key={`property-${index}-${propIndex}`}
                                    title={property.title}
                                    rounded="2xl"
                                    hasFavorite
                                    rating={4.5}
                                    href="/screens/product-detail"
                                    price={property.price}
                                    width={160}
                                    imageHeight={160}
                                    image={property.image}
                                />
                            ))}
                        </CardScroller>
                    </Section>
                ))}

            </AnimatedView>
        </ThemeScroller>

    );
}


export default HomeScreen;