import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import type { CategoryGroup } from '@/utils/barberDetailHelpers';

interface BarberServicesSectionProps {
  groups: CategoryGroup[];
  expandedCategoryId: string | null;
  onToggleCategory: (categoryId: string) => void;
  t: (key: TranslationKey) => string;
}

export default function BarberServicesSection({
  groups,
  expandedCategoryId,
  onToggleCategory,
  t,
}: BarberServicesSectionProps) {
  if (groups.length === 0) return null;

  return (
    <>
      <Divider className="mb-4 mt-8" />
      <Section title={t('barberServices')} titleSize="lg" className="mb-6 mt-2">
        <View className="mt-3 gap-2">
          {groups.map((group) => {
            const isExpanded = expandedCategoryId === group.categoryId;
            return (
              <View
                key={group.categoryId}
                className="overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
                <Pressable
                  onPress={() => onToggleCategory(group.categoryId)}
                  className="flex-row items-center justify-between p-3">
                  <ThemedText variant="body">{group.categoryName}</ThemedText>
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
                        className="flex-row items-center rounded-lg bg-light-primary p-3 dark:bg-dark-primary">
                        {svc.imageUrl ? (
                          <Image
                            source={{ uri: svc.imageUrl }}
                            className="h-12 w-12 rounded-lg"
                            contentFit="cover"
                          />
                        ) : (
                          <View className="h-12 w-12 rounded-lg bg-light-secondary dark:bg-dark-secondary" />
                        )}
                        <View className="ml-3 flex-1">
                          <ThemedText variant="bodySm">{svc.name}</ThemedText>
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {svc.duration ?? '—'} min
                          </ThemedText>
                        </View>
                        <ThemedText variant="bodySm">
                          {svc.price != null ? `${svc.price} Kč` : '—'}
                        </ThemedText>
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
  );
}