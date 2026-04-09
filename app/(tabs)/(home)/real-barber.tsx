import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Section from '@/components/layout/Section';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

export default function RealBarberHomeTab() {
  const actions = useMemo(
    () => [
      {
        id: 'create',
        title: 'Vytvořit rezervaci',
        subtitle: 'Vyber službu a čas',
        icon: 'Scissors',
        onPress: async () => {
          const suppressed = await isReservationIntroCooldownActive();
          router.push(
            suppressed ? '/screens/reservation-create' : '/screens/reservation-create-start'
          );
        },
      },
      {
        id: 'branches',
        title: 'Pobočky',
        subtitle: 'Vyber místo',
        icon: 'MapPin',
        onPress: () => router.push('/' as any),
      },
      {
        id: 'barbers',
        title: 'Barbeři',
        subtitle: 'Najdi svého',
        icon: 'Users',
        onPress: () => router.push('/experience' as any),
      },
      {
        id: 'bookings',
        title: 'Rezervace',
        subtitle: 'Moje termíny',
        icon: 'Calendar',
        onPress: () => router.push('/trips' as any),
      },
    ],
    []
  );

  return (
    <ThemeScroller className="flex-1">
      <View className="mt-4 px-global">
        {/* Quick actions grid (2x2) */}
        <View className="-mx-global mt-4 flex-row flex-wrap justify-between px-0">
          {actions.map((a) => (
            <Pressable
              key={a.id}
              onPress={a.onPress}
              className="mb-2 w-[48.7%] rounded-2xl bg-light-secondary p-4 dark:bg-dark-secondary">
              <ThemedText className="text-base font-semibold">{a.title}</ThemedText>
              <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                {a.subtitle}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Search row */}
        <View className="-mx-global mt-4 px-0">
          <Pressable
            onPress={actions[0]?.onPress}
            className="flex-row items-center gap-2 rounded-full bg-light-secondary px-4 py-3 dark:bg-dark-secondary">
            <Icon name="Search" size={18} className="text-light-subtext dark:text-dark-subtext" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              Co chceš rezervovat?
            </ThemedText>
          </Pressable>
        </View>

        {/* Recent / favorites list (mock) */}
        <Section title="Nedávné" titleSize="md" className="mt-6" />
        <View className="-mx-global mt-2 px-0">
          <View className="rounded-2xl bg-light-secondary p-2 dark:bg-dark-secondary">
            <List variant="divided" spacing={10}>
              <ListItem
                leading={
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-light-primary dark:bg-dark-primary">
                    <Icon
                      name="Clock"
                      size={18}
                      className="text-light-subtext dark:text-dark-subtext"
                    />
                  </View>
                }
                title="Real Barber – Vinohrady"
                subtitle="Poslední pobočka"
                onPress={actions[0]?.onPress}
              />
              <ListItem
                leading={
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-light-primary dark:bg-dark-primary">
                    <Icon
                      name="Clock"
                      size={18}
                      className="text-light-subtext dark:text-dark-subtext"
                    />
                  </View>
                }
                title="Fade + Beard"
                subtitle="Poslední služba"
                onPress={actions[0]?.onPress}
              />
            </List>
          </View>
        </View>
      </View>
    </ThemeScroller>
  );
}
