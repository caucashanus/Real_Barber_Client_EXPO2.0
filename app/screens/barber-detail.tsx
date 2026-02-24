import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
  type EmployeeDetail,
  type EmployeeBranch,
  type EmployeeService,
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

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getEmployeeById(apiToken, id)
      .then(setEmployee)
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
  const rightComponents = employee.name ? [<Favorite key="fav" productName={employee.name} size={25} isWhite />] : undefined;

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

          <View className="flex-row items-center mt-8 mb-8 py-global border-y border-neutral-200 dark:border-dark-secondary">
            <Avatar size="md" src={employee.avatarUrl ?? undefined} name={employee.name} className="mr-4" />
            <View className="ml-0">
              <ThemedText className="font-semibold text-base">Barber</ThemedText>
              {employee.email ? (
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                  {employee.email}
                </ThemedText>
              ) : null}
            </View>
          </View>

          <ThemedText className="text-base">{employee.name}</ThemedText>

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
                <View className="mt-3 gap-3">
                  {getServicesList(employee).map((svc: EmployeeService) => (
                    <View
                      key={svc.id}
                      className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-3"
                    >
                      {svc.imageUrl ? (
                        <Image source={{ uri: svc.imageUrl }} className="w-16 h-16 rounded-lg" resizeMode="cover" />
                      ) : (
                        <View className="w-16 h-16 rounded-lg bg-light-primary dark:bg-dark-primary" />
                      )}
                      <View className="flex-1 ml-3">
                        <ThemedText className="font-medium">{svc.name}</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                          {svc.category?.name ?? '—'} · {svc.duration ?? '—'} min
                        </ThemedText>
                      </View>
                      <ThemedText className="font-semibold">{svc.price != null ? `${svc.price} Kč` : '—'}</ThemedText>
                    </View>
                  ))}
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
    </>
  );
}
