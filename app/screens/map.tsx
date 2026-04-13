import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import ActionSheet, { ActionSheetRef, useSheetRef, FlatList } from 'react-native-actions-sheet';
import MapView, { Callout, MapStyleElement, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBranches, type Branch, type BranchService } from '@/api/branches';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBranchFilter } from '@/app/contexts/BranchFilterContext';
import type { BranchFilterState } from '@/app/contexts/BranchFilterContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import CustomCard from '@/components/CustomCard';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';

import SliderCard from '@/components/SliderCard';
import ShowRating from '@/components/ShowRating';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import Icon from '@/components/Icon';
import SearchBar from '@/components/SearchBar';
import PriceMarker from '@/components/PriceMarker';
import { BRANCH_FILTER_DATA } from '@/constants/branch-filter-data';
import { BRANCH_MARKER_IMAGES } from '@/constants/branch-marker-images';
import { useTranslation } from '@/app/hooks/useTranslation';

const CENTRAL_WAREHOUSE_TEL = '+420774522114';

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
    rating: '4.5',
    description: branch.address?.trim() || branch.name,
    lat,
    lng,
    image:
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400'],
  };
}

function passesFilter(branchTitle: string, filter: BranchFilterState): boolean {
  const data = BRANCH_FILTER_DATA[branchTitle];
  if (!data) return true;
  if (data.sizeM2 < filter.minSizeM2) return false;
  if (filter.minChairs != null && data.chairs < filter.minChairs) return false;
  if (filter.minWashBasins != null && data.washBasins < filter.minWashBasins) return false;
  const a = filter.amenities;
  if (a.cardPayment && !data.amenities.cardPayment) return false;
  if (a.coffeeMachine && !data.amenities.coffeeMachine) return false;
  if (a.selfServiceCheckout && !data.amenities.selfServiceCheckout) return false;
  if (a.within100mMetro && !data.amenities.within100mMetro) return false;
  if (a.within100mTram && !data.amenities.within100mTram) return false;
  if (a.within100mBus && !data.amenities.within100mBus) return false;
  if (a.airConditioning && !data.amenities.airConditioning) return false;
  if (a.wifi && !data.amenities.wifi) return false;
  if (a.parking && !data.amenities.parking) return false;
  const o = filter.options;
  if (o.wheelchairAccessible && !data.options.wheelchairAccessible) return false;
  if (o.airCompressors && !data.options.airCompressors) return false;
  if (o.electricallyAdjustableChairs && !data.options.electricallyAdjustableChairs) return false;
  return true;
}

function applyBranchFilter(items: MapBranchItem[], filter: BranchFilterState): MapBranchItem[] {
  return items.filter((item) => passesFilter(item.title, filter));
}

function stringSearchParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const x = Array.isArray(v) ? v[0] : v;
  return typeof x === 'string' && x.trim().length > 0 ? x : undefined;
}

const MapScreen = () => {
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    mapQuery?: string;
    mapLabel?: string;
    mapCentralWarehouse?: string;
  }>();
  const mapQuery = stringSearchParam(params.mapQuery);
  const mapLabel = stringSearchParam(params.mapLabel);
  const mapCentralWarehouse =
    stringSearchParam(params.mapCentralWarehouse) === '1' ||
    stringSearchParam(params.mapCentralWarehouse)?.toLowerCase() === 'true';
  const { filter, resetFilter } = useBranchFilter();
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number; title: string } | null>(
    null
  );

  useEffect(() => {
    return () => {
      resetFilter();
    };
  }, [resetFilter]);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [allBranches, setAllBranches] = useState<MapBranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

  const branches = useMemo(() => applyBranchFilter(allBranches, filter), [allBranches, filter]);

  useEffect(() => {
    if (!apiToken) {
      setAllBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBranches(apiToken, { includeReviews: true, reviewsLimit: 1 })
      .then((list) => setAllBranches(list.map((b, i) => branchToMapItem(b, i))))
      .catch(() => setAllBranches([]))
      .finally(() => setLoading(false));
  }, [apiToken]);

  useEffect(() => {
    if (!mapQuery) {
      setMapFocus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted' || cancelled) return;
        }
        const results = await Location.geocodeAsync(mapQuery);
        if (cancelled || !results?.length) return;
        const { latitude, longitude } = results[0];
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        const title = mapLabel ?? mapQuery;
        setMapFocus({ lat: latitude, lng: longitude, title });
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            500
          );
        });
      } catch {
        if (!cancelled) setMapFocus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapQuery, mapLabel]);

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
    </>,
  ];

  const [snapIndex, setSnapIndex] = React.useState(0);
  return (
    <>
      <Header showBackButton rightComponents={rightComponents} middleComponent={<SearchBar />} />

      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <MapView
          ref={mapRef}
          className="h-[100vh] w-full"
          initialRegion={{
            latitude: PRAGUE_CENTER.lat - 0.055,
            longitude: PRAGUE_CENTER.lng - 0.015,
            latitudeDelta: 0.28,
            longitudeDelta: 0.28,
          }}>
          {branches.map((branch) => (
            <PriceMarker
              key={branch.id}
              coordinate={{ latitude: branch.lat, longitude: branch.lng }}
              title={branch.title}
              imageSource={BRANCH_MARKER_IMAGES[branch.title] ?? null}
              isSelected={selectedMarkerId === branch.id}
              onPress={() => {
                setSelectedMarkerId(branch.id);
                router.push(`/screens/branch-detail?id=${branch.id}`);
              }}
            />
          ))}
          {mapFocus ? (
            mapCentralWarehouse ? (
              <Marker
                coordinate={{ latitude: mapFocus.lat, longitude: mapFocus.lng }}
                pinColor={colors.highlight}>
                <Callout>
                  <View className="max-w-[300px] px-1 py-1">
                    <ThemedText className="mb-2 text-base font-bold text-black dark:text-white">
                      {mapFocus.title}
                    </ThemedText>
                    <View className="flex-row flex-wrap items-baseline">
                      <ThemedText className="shrink text-sm leading-5 text-neutral-800 dark:text-neutral-200">
                        {t('mapCentralWarehouseCalloutBeforePhone')}{' '}
                      </ThemedText>
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={t('mapCentralWarehousePhoneA11y')}
                        onPress={() => Linking.openURL(`tel:${CENTRAL_WAREHOUSE_TEL}`)}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                        <ThemedText
                          className="text-sm font-semibold leading-5 underline"
                          style={{ color: colors.highlight }}>
                          {t('mapCentralWarehousePhoneDisplay')}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ) : (
              <Marker
                coordinate={{ latitude: mapFocus.lat, longitude: mapFocus.lng }}
                title={mapFocus.title}
                pinColor={colors.highlight}
              />
            )
          ) : null}
        </MapView>

        <ActionSheet
          ref={actionSheetRef}
          isModal={false}
          CustomHeaderComponent={
            <View className="mb-2 w-full items-center justify-center">
              <View className="mt-2 h-2 w-14 rounded-full bg-light-secondary dark:bg-dark-secondary" />
              <ThemedText className="mt-3 font-bold">
                {loading ? '…' : `${branches.length} Branches`}
              </ThemedText>
            </View>
          }
          backgroundInteractionEnabled
          initialSnapIndex={0}
          snapPoints={[10, 100]}
          gestureEnabled
          overdrawEnabled={false}
          closable={false}
          containerStyle={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.bg,
          }}>
          <FlatList
            className="px-2"
            data={branches}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              loading ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" />
                  <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">
                    {t('mapLoadingBranches')}
                  </ThemedText>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <CustomCard
                padding="md"
                className="my-0 w-full overflow-hidden"
                href={`/screens/branch-detail?id=${item.id}`}>
                <ImageCarousel rounded="xl" height={300} className="w-full" images={item.image} />
                <View className="pb-global pt-2">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="text-base font-bold">{item.title}</ThemedText>
                    <ShowRating rating={Number(item.rating)} size="md" />
                  </View>
                  <Text className="text-sm text-light-subtext dark:text-dark-subtext">
                    {item.description}
                  </Text>
                </View>
              </CustomCard>
            )}
          />
        </ActionSheet>
      </View>
    </>
  );
};
export default MapScreen;
