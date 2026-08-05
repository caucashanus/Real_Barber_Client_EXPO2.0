import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { BreadcrumbItem } from '@/utils/breadcrumbs';

interface SiteBreadcrumbsProps {
  items: BreadcrumbItem[];
  accessibilityLabel: string;
  className?: string;
}

function BreadcrumbSeparator() {
  return (
    <Icon
      name="ChevronRight"
      size={14}
      strokeWidth={2}
      className="mx-0.5 shrink-0 text-light-subtext opacity-50 dark:text-dark-subtext"
    />
  );
}

function BreadcrumbCrumb({
  item,
  isCurrent,
}: {
  item: BreadcrumbItem;
  isCurrent: boolean;
}) {
  if (isCurrent || !item.href) {
    return (
      <View
        className="shrink-0 rounded-md bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary"
        accessibilityRole="text"
        accessibilityState={{ selected: true }}
        accessible
        accessibilityLabel={item.name}>
        <ThemedText className="text-xs font-semibold">{item.name}</ThemedText>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(item.href!)}
      accessibilityRole="link"
      accessibilityLabel={item.name}
      className="shrink-0 rounded-full px-2.5 py-1 active:bg-light-secondary/60 dark:active:bg-dark-secondary/60">
      <ThemedText className="text-xs text-light-subtext opacity-60 dark:text-dark-subtext">
        {item.name}
      </ThemedText>
    </Pressable>
  );
}

function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <View key={`${item.name}-${index}`} className="flex-row items-center">
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbCrumb item={item} isCurrent={isCurrent} />
          </View>
        );
      })}
    </>
  );
}

export default function SiteBreadcrumbs({
  items,
  accessibilityLabel,
  className = 'mb-6',
}: SiteBreadcrumbsProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  if (items.length === 0) return null;

  if (isWide) {
    return (
      <View
        accessibilityRole="header"
        accessibilityLabel={accessibilityLabel}
        className={`flex-row flex-wrap items-center ${className}`.trim()}>
        <BreadcrumbTrail items={items} />
      </View>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel={accessibilityLabel} className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
        <BreadcrumbTrail items={items} />
      </ScrollView>
    </View>
  );
}
