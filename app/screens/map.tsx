import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { MapStyleElement, Marker } from 'react-native-maps';
import useThemeColors from '@/app/contexts/ThemeColors';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ActionSheet, { ActionSheetRef, useSheetRef, FlatList } from "react-native-actions-sheet";
import SliderCard from '@/components/SliderCard';
import CustomCard from '@/components/CustomCard';
import ShowRating from '@/components/ShowRating';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import Icon from '@/components/Icon';
import * as LucideIcons from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from '@/components/SearchBar';
import PriceMarker from '@/components/PriceMarker';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBranches, type Branch, type BranchService } from '@/api/branches';

type IconName = Exclude<keyof typeof LucideIcons, 'createLucideIcon' | 'default'>;

const { height } = Dimensions.get('window');

const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

/** Real coordinates per branch name (fallback when API has no lat/lng). */
const BRANCH_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Kačerov: { lat: 50.04219531986807, lng: 14.459689653073983 },
  Hagibor: { lat: 50.07850819920388, lng: 14.48365959725635 },
  Modřany: { lat: 50.00477408096832, lng: 14.416534741433177 },
  Barrandov: { lat: 50.030533187365194, lng: 14.361240910745531 },
};

/** Hardcoded marker logos per branch name (local PNGs). */
const BRANCH_MARKER_IMAGES: Record<string, import('react-native').ImageSourcePropType> = {
  Hagibor: require('@/assets/img/markers/hagiborbarrandov.png'),
  Kačerov: require('@/assets/img/markers/kacerovbarbershop.png'),
  Modřany: require('@/assets/img/markers/modranybarbershop.png'),
  Barrandov: require('@/assets/img/markers/barrandovbarbershop.png'),
};

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

function branchPrice(branch: Branch): string {
  const servicesList = getServicesList(branch);
  const prices = servicesList.map((s) => s.price).filter((p) => p != null);
  if (prices.length === 0) return '';
  const min = Math.min(...prices);
  return `from ${min} Kč`;
}

function branchImages(branch: Branch): string[] {
  const urls = getMediaUrlsSorted(branch.media);
  if (urls.length > 0) return urls;
  if (branch.imageUrl) return [branch.imageUrl];
  const firstService = getServicesList(branch)[0];
  if (firstService?.imageUrl) return [firstService.imageUrl];
  return [];
}

type MapBranchItem = {
  id: string;
  title: string;
  price: string;
  rating: string;
  description: string;
  lat: number;
  lng: number;
  image: string[];
};

function branchToMapItem(branch: Branch, index: number): MapBranchItem {
  const b = branch as { latitude?: number; longitude?: number };
  const nameKey = branch.name?.trim() ?? '';
  let lat: number;
  let lng: number;
  if (b.latitude != null && b.longitude != null) {
    lat = b.latitude;
    lng = b.longitude;
  } else if (BRANCH_COORDINATES[nameKey]) {
    lat = BRANCH_COORDINATES[nameKey].lat;
    lng = BRANCH_COORDINATES[nameKey].lng;
  } else {
    lat = PRAGUE_CENTER.lat + index * 0.004;
    lng = PRAGUE_CENTER.lng + index * 0.006;
  }
  const images = branchImages(branch);
  return {
    id: branch.id,
    title: branch.name,
    price: branchPrice(branch) || '—',
    rating: '4.5',
    description: branch.address?.trim() || branch.name,
    lat,
    lng,
    image: images.length > 0 ? images : ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400'],
  };
}


const MapScreen = () => {
    const colors = useThemeColors();
    const { apiToken } = useAuth();
    const actionSheetRef = useRef<ActionSheetRef>(null);
    const mapRef = useRef<MapView>(null);
    const insets = useSafeAreaInsets();
    const [branches, setBranches] = useState<MapBranchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

    useEffect(() => {
        if (!apiToken) {
            setBranches([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        getBranches(apiToken, { includeReviews: true, reviewsLimit: 1 })
            .then((list) => setBranches(list.map((b, i) => branchToMapItem(b, i))))
            .catch(() => setBranches([]))
            .finally(() => setLoading(false));
    }, [apiToken]);

    useEffect(() => {
        actionSheetRef.current?.show();
    }, []);



    const rightComponents = [
        <>
            {/*<HeaderIcon
            onPress={() => {
                if (!actionSheetRef.current) return;
                const nextIndex = actionSheetRef.current.currentSnapIndex() === 0 ? 1 : 0;
                actionSheetRef.current.snapToIndex(nextIndex);
                setSnapIndex(nextIndex);
            }}
            icon="Map" href="0" />,*/}
            <HeaderIcon icon="SlidersHorizontal" href="/screens/filters" />
        </>
    ];

    const [snapIndex, setSnapIndex] = React.useState(0);
    return (
        <>
            <Header showBackButton
                rightComponents={rightComponents}
                middleComponent={<SearchBar />} />

            <View className="flex-1 bg-light-primary dark:bg-dark-primary">
                <MapView
                    ref={mapRef}
                    className="w-full h-[100vh]"
                    initialRegion={{
                        latitude: PRAGUE_CENTER.lat,
                        longitude: PRAGUE_CENTER.lng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {branches.map((branch) => (
                        <PriceMarker
                            key={branch.id}
                            coordinate={{ latitude: branch.lat, longitude: branch.lng }}
                            title={branch.title}
                            imageSource={BRANCH_MARKER_IMAGES[branch.title] ?? null}
                            isSelected={selectedMarkerId === branch.id}
                            onPress={() => setSelectedMarkerId(branch.id)}
                        />
                    ))}
                </MapView>

                <ActionSheet
                    ref={actionSheetRef}
                    isModal={false}
                    CustomHeaderComponent={
                        <View className='w-full items-center justify-center mb-2'>
                            <View className="w-14 h-2 mt-2 rounded-full bg-light-secondary dark:bg-dark-secondary" />
                            <ThemedText className='font-bold mt-3'>
                                {loading ? '…' : `${branches.length} Branches`}
                            </ThemedText>
                        </View>
                    }
                    backgroundInteractionEnabled
                    initialSnapIndex={1}
                    snapPoints={[10, 100]}
                    gestureEnabled
                    overdrawEnabled={false}
                    closable={false}
                    containerStyle={{
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        backgroundColor: colors.bg
                    }}

                >
                    <FlatList
                        className='px-2'
                        data={branches}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            loading ? (
                                <View className="py-12 items-center">
                                    <ActivityIndicator size="large" />
                                    <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">Loading branches…</ThemedText>
                                </View>
                            ) : null
                        }
                        renderItem={({ item }) => (
                            <CustomCard
                                padding="md"
                                className="my-0 w-full overflow-hidden"
                                href={`/screens/branch-detail?id=${item.id}`}
                            >
                                <ImageCarousel
                                    rounded='xl'
                                    height={300}
                                    className='w-full'
                                    images={item.image}
                                />
                                <View className='pb-global pt-2'>
                                    <View className="flex-row items-center justify-between">
                                        <ThemedText className="text-base font-bold">{item.title}</ThemedText>
                                        <ShowRating rating={Number(item.rating)} size="md" />
                                    </View>
                                    <Text className="text-sm text-light-subtext dark:text-dark-subtext">
                                        {item.description}
                                    </Text>
                                    <ThemedText className='font-bold text-base mt-2'>{item.price}</ThemedText>
                                </View>
                            </CustomCard>
                        )}
                    />
                </ActionSheet >
            </View >
        </>
    );
};
export default MapScreen;
