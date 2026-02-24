import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import ImageCarousel from '@/components/ImageCarousel';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import ShowRating from '@/components/ShowRating';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBranches, type Branch, type BranchService, type BranchEmployee } from '@/api/branches';

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getEmployeesList(branch: Branch): BranchEmployee[] {
  const e = branch.employees;
  if (!e) return [];
  if (Array.isArray(e)) return e;
  return Object.values(e);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

function branchImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaUrls = getMediaUrlsSorted(branch.media);
  mediaUrls.forEach((url) => out.push(url));
  if (branch.imageUrl) out.push(branch.imageUrl);
  const servicesList = getServicesList(branch);
  servicesList.forEach((svc) => { if (svc.imageUrl) out.push(svc.imageUrl); });
  if (out.length === 0) out.push(require('@/assets/img/room-1.avif'));
  return out;
}

function branchMinPrice(branch: Branch): number | null {
  const servicesList = getServicesList(branch);
  const prices = servicesList.map((s) => s.price).filter((p) => p != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

// 3D VR prohlídka – manuální mapování podle názvu pobočky (data nejsou z API)
const VR_TOUR_URL_BY_BRANCH_NAME: Record<string, string | null> = {
  Barrandov: null,
  Modřany: 'https://my.matterport.com/show/?m=SrYbx9DgJ3n',
  Kačerov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Kaceřov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Hagibor: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
  HAGIBOR: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
};

function getVrTourUrl(branchName: string): string | null {
  return VR_TOUR_URL_BY_BRANCH_NAME[branchName] ?? null;
}

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBranches(apiToken, { includeReviews: true, reviewsLimit: 1 })
      .then((list) => {
        const found = list.find((b) => b.id === id) ?? null;
        setBranch(found);
        if (!found) setError('Branch not found');
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

  if (error || !branch) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Branch not found'}</ThemedText>
        </View>
      </>
    );
  }

  const images = branchImages(branch).map((img) => (typeof img === 'string' ? img : img));
  const minPrice = branchMinPrice(branch);
  const employeesList = getEmployeesList(branch);
  const vrTourUrl = getVrTourUrl(branch.name);
  const webUrl = branch.webUrl ?? null;
  const rightComponents = branch.name ? [<Favorite key="fav" productName={branch.name} size={25} isWhite />] : undefined;

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
            <ThemedText className="text-3xl text-center font-semibold">{branch.name}</ThemedText>
            <View className="flex-row items-center justify-center mt-4">
              <ShowRating rating={4.5} size="lg" className="px-4 py-2 border-r border-neutral-200 dark:border-dark-secondary" />
              <ThemedText className="text-base px-4">Reviews</ThemedText>
            </View>
          </View>

          <View className="flex-row items-center mt-8 mb-8 py-global border-y border-neutral-200 dark:border-dark-secondary">
            <Avatar size="md" name={branch.name} className="mr-4" />
            <View className="ml-0">
              <ThemedText className="font-semibold text-base">Branch</ThemedText>
              <View className="flex-row items-center">
                <Icon name="MapPin" size={12} className="mr-1" />
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                  {branch.address ?? 'Address not set'}
                </ThemedText>
              </View>
            </View>
          </View>

          <ThemedText className="text-base">
            {branch.address ? `${branch.name} – ${branch.address}` : branch.name}
          </ThemedText>

          {employeesList.length > 0 ? (
            <>
              <Divider className="mb-4 mt-8" />
              <Section title="Team" titleSize="lg" className="mb-6 mt-2">
                <View className="mt-3 flex-row flex-wrap gap-6">
                  {employeesList.map((emp: BranchEmployee) => (
                    <View key={emp.id} className="items-center">
                      <Avatar size="lg" src={emp.avatarUrl ?? undefined} name={emp.name} />
                      <ThemedText className="mt-2 text-sm font-medium" numberOfLines={1}>{emp.name}</ThemedText>
                    </View>
                  ))}
                </View>
              </Section>
            </>
          ) : null}

          <Divider className="mb-4 mt-8" />

          <View className="mb-6">
            {vrTourUrl ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(vrTourUrl)}
                className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-4 mb-3"
              >
                <Icon name="Box" size={24} className="mr-3" />
                <View className="flex-1">
                  <ThemedText className="font-medium">3D VR tour</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">View the branch in 3D</ThemedText>
                </View>
                <Icon name="ChevronRight" size={20} className="opacity-60" />
              </Pressable>
            ) : null}
            {webUrl ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(webUrl)}
                className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-4 mb-3"
              >
                <Icon name="Globe" size={24} className="mr-3" />
                <View className="flex-1">
                  <ThemedText className="font-medium">Web</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext" numberOfLines={1}>{webUrl}</ThemedText>
                </View>
                <Icon name="ChevronRight" size={20} className="opacity-60" />
              </Pressable>
            ) : null}
          </View>

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start px-global pt-4 border-t border-neutral-200 dark:border-dark-secondary bg-light-primary dark:bg-dark-primary"
      >
        <View>
          <ThemedText className="text-xl font-bold">
            {minPrice != null ? `From ${minPrice} Kč` : '—'}
          </ThemedText>
          <ThemedText className="text-xs opacity-60">Services</ThemedText>
        </View>
        <View className="flex-row items-center ml-auto">
          <Button
            title="Reserve"
            className="bg-highlight ml-6 px-6"
            textClassName="text-white"
            size="medium"
            rounded="lg"
            href={`/screens/checkout?branchId=${branch.id}`}
          />
        </View>
      </View>
    </>
  );
}
