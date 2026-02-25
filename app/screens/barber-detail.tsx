import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Pressable, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import ImageCarousel from '@/components/ImageCarousel';
import Divider from '@/components/layout/Divider';
import ShowRating from '@/components/ShowRating';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  getEmployeeById,
  getEmployees,
  type EmployeeDetail,
  type EmployeeBranch,
  type EmployeeService,
  type EmployeeMediaItem,
} from '@/api/employees';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import { router } from 'expo-router';

function employeeImages(employee: EmployeeDetail): (string | number)[] {
  const out: (string | number)[] = [];
  if (employee.avatarUrl) out.push(employee.avatarUrl);
  const media = employee.media;
  if (media) {
    const list = Array.isArray(media) ? media : Object.values(media);
    list.forEach((m: { url?: string }) => { if (m?.url) out.push(m.url); });
  }
  if (out.length === 0) out.push(require('@/assets/img/room-1.avif'));
  return out;
}

function getBranchesList(employee: EmployeeDetail): EmployeeBranch[] {
  const b = employee.branches;
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Object.values(b);
}

function getServicesList(employee: EmployeeDetail): EmployeeService[] {
  const s = employee.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaList(employee: EmployeeDetail): EmployeeMediaItem[] {
  const m = employee.media;
  if (!m) return [];
  const list = Array.isArray(m) ? [...m] : Object.values(m);
  const withUrl = list.filter((item) => item?.url);
  withUrl.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withUrl;
}

type CategoryGroup = { categoryId: string; categoryName: string; services: EmployeeService[] };

function groupServicesByCategory(services: EmployeeService[]): CategoryGroup[] {
  const byId = new Map<string, CategoryGroup>();
  for (const svc of services) {
    const id = svc.category?.id ?? 'unknown';
    const name = svc.category?.name ?? '—';
    if (!byId.has(id)) byId.set(id, { categoryId: id, categoryName: name, services: [] });
    byId.get(id)!.services.push(svc);
  }
  return Array.from(byId.values());
}

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<EmployeeMediaItem | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDescription(null);
    Promise.all([
      getEmployeeById(apiToken, id),
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 1 }).catch(() => [] as EmployeeDetail[]),
    ])
      .then(([detail, list]) => {
        setEmployee(detail);
        const arr = Array.isArray(list) ? list : Object.values(list);
        const fromList = arr.find((e) => e.id === id);
        if (fromList?.description) setDescription(fromList.description);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  if (loading) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
        </View>
      </>
    );
  }

  if (error || !employee) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Barber not found'}</ThemedText>
        </View>
      </>
    );
  }

  const images = employeeImages(employee).map((img) => (typeof img === 'string' ? img : img));
  const rightComponents = employee.name ? [
    <Favorite
      key="fav"
      productName={employee.name}
      title={employee.name}
      entityType="employee"
      entityId={employee.id}
      size={25}
      isWhite
    />,
  ] : undefined;

  return (
    <>
      <StatusBar style="light" translucent />
      <Header variant="transparent" title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller className="px-0 bg-light-primary dark:bg-dark-primary">
        <ImageCarousel
          images={images}
          height={500}
          paginationStyle="dots"
        />

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="p-global bg-light-primary dark:bg-dark-primary -mt-[30px]"
        >
          <View className="">
            <ThemedText className="text-3xl text-center font-semibold">{employee.name}</ThemedText>
            <View className="flex-row items-center justify-center mt-4">
              <ShowRating rating={4.5} size="lg" className="px-4 py-2 border-r border-neutral-200 dark:border-dark-secondary" />
              <ThemedText className="text-base px-4">Reviews</ThemedText>
            </View>
          </View>

          <View className="mt-8 mb-8 py-global border-y border-neutral-200 dark:border-dark-secondary">
            <View className="flex-row items-center mb-3">
              <Avatar size="md" src={employee.avatarUrl ?? undefined} name={employee.name} className="mr-4" />
              <ThemedText className="font-semibold text-base">About me</ThemedText>
            </View>
            {description ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext" style={{ lineHeight: 22 }}>
                {description}
              </ThemedText>
            ) : null}
          </View>

          {getMediaList(employee).length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title="Work samples" titleSize="lg" className="mb-6 mt-2">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
                  className="-mx-global px-global"
                >
                  {getMediaList(employee).map((item, index) => (
                    <Pressable
                      key={item.id ?? index}
                      onPress={() => setFullscreenMedia(item)}
                      className="rounded-xl overflow-hidden"
                      style={{ width: 160, height: 160 }}
                    >
                      {item.type === 'video' ? (
                        <View className="w-full h-full bg-light-secondary dark:bg-dark-secondary items-center justify-center">
                          <Icon name="Play" size={40} className="opacity-70" />
                          <ThemedText className="text-xs mt-2 text-light-subtext dark:text-dark-subtext">Video</ThemedText>
                        </View>
                      ) : (
                        <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </Section>
            </>
          ) : null}

          {getBranchesList(employee).length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title="Branches" titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 gap-3">
                  {getBranchesList(employee).map((branch: EmployeeBranch) => (
                    <Pressable
                      key={branch.id}
                      onPress={() => router.push(`/screens/branch-detail?id=${branch.id}`)}
                      className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-3"
                    >
                      {branch.imageUrl ? (
                        <Image source={{ uri: branch.imageUrl }} className="w-12 h-12 rounded-lg" resizeMode="cover" />
                      ) : (
                        <View className="w-12 h-12 rounded-lg bg-light-primary dark:bg-dark-primary" />
                      )}
                      <View className="flex-1 ml-3">
                        <ThemedText className="font-medium">{branch.name}</ThemedText>
                        {branch.address ? (
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                            {branch.address}
                          </ThemedText>
                        ) : null}
                      </View>
                      <Icon name="ChevronRight" size={20} className="opacity-60" />
                    </Pressable>
                  ))}
                </View>
              </Section>
            </>
          ) : null}

          {getServicesList(employee).length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title="Services" titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 gap-2">
                  {groupServicesByCategory(getServicesList(employee)).map((group) => {
                    const isExpanded = expandedCategoryId === group.categoryId;
                    return (
                      <View key={group.categoryId} className="rounded-xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
                        <Pressable
                          onPress={() => setExpandedCategoryId(isExpanded ? null : group.categoryId)}
                          className="flex-row items-center justify-between p-3"
                        >
                          <ThemedText className="font-medium">{group.categoryName}</ThemedText>
                          <Icon
                            name="ChevronDown"
                            size={20}
                            className={`opacity-60 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </Pressable>
                        {isExpanded ? (
                          <View className="gap-2 px-3 pb-3 pt-0">
                            {group.services.map((svc) => (
                              <View
                                key={svc.id}
                                className="flex-row items-center rounded-lg bg-light-primary dark:bg-dark-primary p-3"
                              >
                                {svc.imageUrl ? (
                                  <Image source={{ uri: svc.imageUrl }} className="w-12 h-12 rounded-lg" resizeMode="cover" />
                                ) : (
                                  <View className="w-12 h-12 rounded-lg bg-light-secondary dark:bg-dark-secondary" />
                                )}
                                <View className="flex-1 ml-3">
                                  <ThemedText className="font-medium text-sm">{svc.name}</ThemedText>
                                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                    {svc.duration ?? '—'} min
                                  </ThemedText>
                                </View>
                                <ThemedText className="font-semibold text-sm">{svc.price != null ? `${svc.price} Kč` : '—'}</ThemedText>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </Section>
            </>
          ) : null}

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start px-global pt-4 border-t border-neutral-200 dark:border-dark-secondary bg-light-primary dark:bg-dark-primary"
      >
        <View>
          <ThemedText className="text-xl font-bold">Book</ThemedText>
          <ThemedText className="text-xs opacity-60">Reserve with this barber</ThemedText>
        </View>
        <View className="flex-row items-center ml-auto">
          <Button
            title="Reserve"
            className="bg-highlight ml-6 px-6"
            textClassName="text-white"
            size="medium"
            rounded="lg"
            href={`/screens/checkout?employeeId=${employee.id}`}
          />
        </View>
      </View>

      <Modal
        visible={!!fullscreenMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenMedia(null)}
      >
        <View style={{ flex: 1, width: winWidth, height: winHeight, backgroundColor: '#000' }}>
          <Pressable
            onPress={() => setFullscreenMedia(null)}
            style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, padding: 8 }}
            className="rounded-full bg-black/50"
          >
            <Icon name="X" size={24} className="text-white" />
          </Pressable>
          {fullscreenMedia?.type === 'video' ? (
            <Video
              source={{ uri: fullscreenMedia.url }}
              style={{ width: winWidth, height: winHeight }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              isLooping={false}
            />
          ) : fullscreenMedia ? (
            <Pressable style={{ flex: 1 }} onPress={() => setFullscreenMedia(null)}>
              <Image
                source={{ uri: fullscreenMedia.url }}
                style={{ width: winWidth, height: winHeight }}
                resizeMode="contain"
              />
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
