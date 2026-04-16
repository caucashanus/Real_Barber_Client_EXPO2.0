import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Section from '@/components/layout/Section';
import { BRANCH_MARKER_IMAGES } from '@/constants/branch-marker-images';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

function isBookingNotCancelled(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  return status !== 'cancelled' && status !== 'canceled';
}

function isBookingPast(booking: Booking): boolean {
  if (!isBookingNotCancelled(booking)) return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}

export default function RealBarberHomeTab() {
  const { apiToken } = useAuth();
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
        onPress: () => router.push('/branches' as any),
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

  const [recentLoading, setRecentLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!apiToken) {
      setRecentBookings([]);
      return;
    }
    setRecentLoading(true);
    getBookings(apiToken, { limit: 50, offset: 0 })
      .then((res) => {
        const items = res.bookings
          .filter(isBookingPast)
          .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
          .slice(0, 3);
        setRecentBookings(items);
      })
      .catch(() => setRecentBookings([]))
      .finally(() => setRecentLoading(false));
  }, [apiToken]);

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

        {/* Recent bookings */}
        <Section title="Nedávné" titleSize="md" className="mt-6" />
        <View className="-mx-global mt-2 px-0">
          <View className="rounded-2xl bg-light-secondary p-2 dark:bg-dark-secondary">
            {recentLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator size="small" />
                <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                  Načítám…
                </ThemedText>
              </View>
            ) : recentBookings.length === 0 ? (
              <View className="px-4 py-6">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Zatím nemáte žádné rezervace.
                </ThemedText>
              </View>
            ) : (
              <List variant="divided" spacing={10}>
                {recentBookings.map((b) => (
                  <ListItem
                    key={b.id}
                    leading={
                      <View className="flex-row items-center gap-2">
                        <View className="h-10 w-10 overflow-hidden rounded-xl bg-light-primary dark:bg-dark-primary">
                          {b.branch?.name && BRANCH_MARKER_IMAGES[b.branch.name] ? (
                            <Image
                              source={BRANCH_MARKER_IMAGES[b.branch.name]}
                              className="h-10 w-10"
                              resizeMode="cover"
                            />
                          ) : null}
                        </View>
                        <ThemedText className="text-sm font-semibold text-light-subtext dark:text-dark-subtext">
                          +
                        </ThemedText>
                        <Avatar
                          size="sm"
                          src={b.employee?.avatarUrl ?? undefined}
                          name={b.employee?.name ?? undefined}
                          className="bg-light-primary dark:bg-dark-primary"
                        />
                      </View>
                    }
                    title={`${b.item?.name ?? 'Rezervace'} - ${b.employee?.name ?? '—'}`}
                    subtitle={b.branch?.name ?? ''}
                    onPress={() =>
                      router.push(`/screens/trip-detail?id=${encodeURIComponent(b.id)}` as any)
                    }
                  />
                ))}
              </List>
            )}
          </View>
        </View>
      </View>
    </ThemeScroller>
  );
}
