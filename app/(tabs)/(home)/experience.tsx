import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Pressable, ActivityIndicator } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { ScrollContext } from './_layout';

import { getEmployees, type Employee } from '@/api/employees';
import { getFavorites } from '@/api/favorites';
import { getClientReviewsList, type ClientReviewListItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

const NEW_BARBERS_DAYS = 30;

/** API uses Cyrillic day names: Sun, Mon, Tue, Wed, Thu, Fri, Sat */
const WEEKDAY_API_KEYS = [
  'Воскресенье', // 0 Sunday
  'Понедельник', // 1 Monday
  'Вторник', // 2 Tuesday
  'Среда', // 3 Wednesday
  'Четверг', // 4 Thursday
  'Пятница', // 5 Friday
  'Суббота', // 6 Saturday
];

function isEmployeeNew(emp: Employee): boolean {
  const createdAt = emp.createdAt;
  if (!createdAt || typeof createdAt !== 'string') return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const now = Date.now();
  const limitMs = NEW_BARBERS_DAYS * 24 * 60 * 60 * 1000;
  return now - created <= limitMs;
}

function hasShiftToday(emp: Employee): boolean {
  const ws = emp.workSchedule as
    | { weeklySchedule?: Record<string, { validFrom?: string; validUntil?: string }[]> }
    | undefined;
  const weekly = ws?.weeklySchedule;
  if (!weekly || typeof weekly !== 'object') return false;
  const dayIndex = new Date().getDay();
  const dayKey = WEEKDAY_API_KEYS[dayIndex];
  const slots = weekly[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  for (const slot of slots) {
    const from = slot.validFrom ? slot.validFrom.slice(0, 10) : '';
    const until = slot.validUntil ? slot.validUntil.slice(0, 10) : '';
    if (from && until && todayStr >= from && todayStr <= until) return true;
  }
  return false;
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const SECTION_TITLE_KEYS: Record<string, string> = {
  'New barbers': 'experienceNewBarbers',
  'Popular barbers available today': 'experiencePopularToday',
  'All barbers': 'experienceAllBarbers',
  'My favorite barbers': 'experienceMyFavorites',
  'Best rated barbers': 'experienceBestRated',
};

const ExperienceScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeReviewsList, setEmployeeReviewsList] = useState<ClientReviewListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [favoriteEmployeeIds, setFavoriteEmployeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (!apiToken) return;
    setEmployeesLoading(true);
    setEmployeesError(null);
    Promise.all([
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 1 }),
      getClientReviewsList(apiToken, { entityType: 'employee', limit: 500 }),
    ])
      .then(([empList, reviewsData]) => {
        setEmployees(Array.isArray(empList) ? empList : Object.values(empList));
        setEmployeeReviewsList(reviewsData.reviews || []);
      })
      .catch((e) => {
        setEmployeesError(e instanceof Error ? e.message : 'Failed to load');
        setEmployeeReviewsList([]);
      })
      .finally(() => setEmployeesLoading(false));
  }, [apiToken]);

  const loadFavoriteEmployees = useCallback(() => {
    if (!apiToken) return;
    getFavorites(apiToken, { entityType: 'employee' })
      .then((list) => setFavoriteEmployeeIds(list.map((f) => f.entityId)))
      .catch(() => setFavoriteEmployeeIds([]));
  }, [apiToken]);

  useFocusEffect(
    useCallback(() => {
      loadFavoriteEmployees();
    }, [loadFavoriteEmployees])
  );

  const newBarbers = employees.filter(isEmployeeNew).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
    return tb - ta;
  });

  const barbersAvailableToday = employees.filter(hasShiftToday);

  const allBarbersShuffled = useMemo(() => shuffleArray(employees), [employees]);

  const favoriteBarbers = useMemo(
    () => employees.filter((emp) => favoriteEmployeeIds.includes(emp.id)),
    [employees, favoriteEmployeeIds]
  );

  const { bestRatedBarbers, employeeAverageRating } = useMemo(() => {
    const byId: Record<string, { sum: number; count: number }> = {};
    for (const r of employeeReviewsList) {
      const id = r.entityId;
      if (!id) continue;
      if (!byId[id]) byId[id] = { sum: 0, count: 0 };
      byId[id].sum += r.rating;
      byId[id].count += 1;
    }
    const employeesWithReviews = employees.filter((emp) => (byId[emp.id]?.count ?? 0) >= 1);
    employeesWithReviews.sort((a, b) => {
      const avgA = byId[a.id] ? byId[a.id].sum / byId[a.id].count : 0;
      const avgB = byId[b.id] ? byId[b.id].sum / byId[b.id].count : 0;
      return avgB - avgA;
    });
    const ratingMap: Record<string, number> = {};
    for (const id of Object.keys(byId)) {
      const x = byId[id];
      ratingMap[id] = x.count > 0 ? Math.round((x.sum / x.count) * 10) / 10 : 0;
    }
    return { bestRatedBarbers: employeesWithReviews, employeeAverageRating: ratingMap };
  }, [employees, employeeReviewsList]);

  const newBarbersInfoSheetRef = useRef<ActionSheetRef>(null);

  const sections = [
    {
      title: 'Popular barbers available today',
      experiences: [
        {
          title: 'Street Art Walking Tour',
          image: 'https://images.unsplash.com/photo-1503410781609-75b1d892dd28?q=80&w=400',
          price: '$35',
          rating: 4.9,
        },
        {
          title: 'Craft Beer Experience',
          image: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?q=80&w=400',
          price: '$55',
          rating: 4.7,
        },
        {
          title: 'DUMBO Photo Tour',
          image: 'https://images.unsplash.com/photo-1520190282873-afe1285c9a2a?q=80&w=400',
          price: '$40',
          rating: 4.8,
        },
        {
          title: 'Williamsburg Food Scene',
          image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400',
          price: '$70',
          rating: 4.6,
        },
      ],
    },
    {
      title: 'New barbers',
      experiences: [
        {
          title: 'Rooftop Bar Hopping',
          image:
            'https://images.pexels.com/photos/13542704/pexels-photo-13542704.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$75',
          rating: 4.8,
          badge: 'New',
        },
        {
          title: 'Museum Mile Tour',
          image:
            'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$45',
          rating: 4.9,
          badge: 'New',
        },
        {
          title: 'Broadway Behind the Scenes',
          image: 'https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?q=80&w=400',
          price: '$95',
          rating: 4.7,
        },
        {
          title: 'Food Tour in Little Italy',
          image:
            'https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$65',
          rating: 4.6,
        },
      ],
    },
    {
      title: 'Best rated barbers',
      experiences: [
        {
          title: 'Flushing Food Adventure',
          image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?q=80&w=400',
          price: '$55',
          rating: 4.8,
        },
        {
          title: 'Art District Gallery Hop',
          image:
            'https://images.pexels.com/photos/161154/stained-glass-spiral-circle-pattern-161154.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$35',
          rating: 4.6,
        },
        {
          title: 'Night Market Experience',
          image: 'https://images.unsplash.com/photo-1536392706976-e486e2ba97af?q=80&w=400',
          price: '$45',
          rating: 4.7,
        },
        {
          title: 'Cultural Dance Workshop',
          image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400',
          price: '$40',
          rating: 4.8,
        },
      ],
    },
    {
      title: 'All barbers',
      experiences: [
        {
          title: 'Jazz Club Evening',
          image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=400',
          price: '$60',
          rating: 4.9,
        },
        {
          title: 'Soul Food Tour',
          image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400',
          price: '$50',
          rating: 4.8,
        },
        {
          title: 'Gospel Experience',
          image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400',
          price: '$45',
          rating: 4.9,
        },
        {
          title: 'Historic Harlem Tour',
          image:
            'https://images.pexels.com/photos/9471914/pexels-photo-9471914.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$40',
          rating: 4.7,
        },
      ],
    },
    {
      title: 'My favorite barbers',
      experiences: [
        {
          title: 'Sunset Sail Experience',
          image:
            'https://images.pexels.com/photos/3346227/pexels-photo-3346227.jpeg?auto=compress&cs=tinysrgb&w=1200',
          price: '$95',
          rating: 4.9,
        },
        {
          title: 'Helicopter City Tour',
          image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?q=80&w=400',
          price: '$299',
          rating: 4.8,
        },
        {
          title: 'Secret Speakeasy Tour',
          image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=400',
          price: '$85',
          rating: 4.7,
        },
        {
          title: 'Urban Photography',
          image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=400',
          price: '$65',
          rating: 4.8,
        },
      ],
    },
  ];

  if (employeesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
          {t('commonLoading')}
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      <ThemeScroller
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="scaleIn" className="mt-4 flex-1">
          {sections
            .filter((section) => {
              if (section.title === 'New barbers') return newBarbers.length > 0 || employeesLoading;
              if (section.title === 'Popular barbers available today')
                return barbersAvailableToday.length > 0 || employeesLoading;
              if (section.title === 'My favorite barbers')
                return favoriteBarbers.length > 0 || employeesLoading;
              if (section.title === 'Best rated barbers')
                return bestRatedBarbers.length > 0 || employeesLoading;
              return true;
            })
            .map((section, index) => (
              <Section
                key={`barbers-section-${index}`}
                title={
                  SECTION_TITLE_KEYS[section.title]
                    ? t(SECTION_TITLE_KEYS[section.title] as TranslationKey)
                    : section.title
                }
                titleSize="lg"
                titleTrailing={
                  section.title === 'New barbers' ? (
                    <Pressable
                      onPress={() => newBarbersInfoSheetRef.current?.show()}
                      hitSlop={8}
                      className="p-1">
                      <Icon
                        name="Info"
                        size={18}
                        className="text-light-subtext dark:text-dark-subtext"
                      />
                    </Pressable>
                  ) : section.title === 'Popular barbers available today' ? (
                    <Button
                      title={t('experienceSchedule')}
                      size="small"
                      variant="outline"
                      rounded="lg"
                      className="ml-auto px-3 py-1.5"
                      textClassName="text-xs"
                      href="/screens/schedule"
                    />
                  ) : undefined
                }
                link={
                  section.title === 'All barbers' ||
                  section.title === 'New barbers' ||
                  section.title === 'Popular barbers available today' ||
                  section.title === 'Best rated barbers'
                    ? undefined
                    : '/screens/map'
                }
                linkText={
                  section.title === 'All barbers' ||
                  section.title === 'New barbers' ||
                  section.title === 'Popular barbers available today' ||
                  section.title === 'Best rated barbers'
                    ? undefined
                    : t('commonViewAll')
                }>
                <CardScroller space={15} className="mt-1.5 pb-4">
                  {section.title === 'New barbers' ? (
                    <>
                      {employeesLoading && (
                        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                          {t('commonLoading')}
                        </ThemedText>
                      )}
                      {employeesError && (
                        <ThemedText className="py-4 text-red-500 dark:text-red-400">
                          {employeesError}
                        </ThemedText>
                      )}
                      {!employeesLoading &&
                        !employeesError &&
                        newBarbers.map((emp) => (
                          <Card
                            key={emp.id}
                            title={emp.name}
                            rounded="2xl"
                            hasFavorite
                            favoriteEntityType="employee"
                            favoriteEntityId={emp.id}
                            href={`/screens/barber-detail?id=${emp.id}`}
                            price=""
                            width={160}
                            imageHeight={160}
                            image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                            badge={t('experienceNewBarbersBadge')}
                          />
                        ))}
                    </>
                  ) : section.title === 'Popular barbers available today' ? (
                    <>
                      {employeesLoading && (
                        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                          {t('commonLoading')}
                        </ThemedText>
                      )}
                      {employeesError && (
                        <ThemedText className="py-4 text-red-500 dark:text-red-400">
                          {employeesError}
                        </ThemedText>
                      )}
                      {!employeesLoading &&
                        !employeesError &&
                        barbersAvailableToday.map((emp) => (
                          <Card
                            key={emp.id}
                            title={emp.name}
                            topLeftBadge={<LiveIndicator />}
                            rounded="2xl"
                            hasFavorite
                            favoriteEntityType="employee"
                            favoriteEntityId={emp.id}
                            href={`/screens/barber-detail?id=${emp.id}`}
                            price=""
                            width={160}
                            imageHeight={160}
                            image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                          />
                        ))}
                    </>
                  ) : section.title === 'All barbers' ? (
                    <>
                      {employeesLoading && (
                        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                          {t('commonLoading')}
                        </ThemedText>
                      )}
                      {employeesError && (
                        <ThemedText className="py-4 text-red-500 dark:text-red-400">
                          {employeesError}
                        </ThemedText>
                      )}
                      {!employeesLoading &&
                        !employeesError &&
                        allBarbersShuffled.map((emp) => (
                          <Card
                            key={emp.id}
                            title={emp.name}
                            rounded="2xl"
                            hasFavorite
                            favoriteEntityType="employee"
                            favoriteEntityId={emp.id}
                            href={`/screens/barber-detail?id=${emp.id}`}
                            price=""
                            width={160}
                            imageHeight={160}
                            image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                          />
                        ))}
                    </>
                  ) : section.title === 'My favorite barbers' ? (
                    <>
                      {employeesLoading && (
                        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                          {t('commonLoading')}
                        </ThemedText>
                      )}
                      {employeesError && (
                        <ThemedText className="py-4 text-red-500 dark:text-red-400">
                          {employeesError}
                        </ThemedText>
                      )}
                      {!employeesLoading &&
                        !employeesError &&
                        favoriteBarbers.map((emp) => (
                          <Card
                            key={emp.id}
                            title={emp.name}
                            rounded="2xl"
                            hasFavorite
                            favoriteEntityType="employee"
                            favoriteEntityId={emp.id}
                            href={`/screens/barber-detail?id=${emp.id}`}
                            price=""
                            width={160}
                            imageHeight={160}
                            image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                          />
                        ))}
                    </>
                  ) : section.title === 'Best rated barbers' ? (
                    <>
                      {employeesLoading && (
                        <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                          {t('commonLoading')}
                        </ThemedText>
                      )}
                      {employeesError && (
                        <ThemedText className="py-4 text-red-500 dark:text-red-400">
                          {employeesError}
                        </ThemedText>
                      )}
                      {!employeesLoading &&
                        !employeesError &&
                        bestRatedBarbers.map((emp) => (
                          <Card
                            key={emp.id}
                            title={emp.name}
                            rounded="2xl"
                            hasFavorite
                            favoriteEntityType="employee"
                            favoriteEntityId={emp.id}
                            href={`/screens/barber-detail?id=${emp.id}`}
                            price=""
                            rating={employeeAverageRating[emp.id]}
                            width={160}
                            imageHeight={160}
                            image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                          />
                        ))}
                    </>
                  ) : (
                    section.experiences.map((experience, propIndex) => (
                      <Card
                        key={`experience-${index}-${propIndex}`}
                        title={experience.title}
                        rounded="2xl"
                        hasFavorite
                        rating={experience.rating}
                        href="/screens/experience-detail"
                        price={experience.price}
                        width={160}
                        imageHeight={160}
                        image={experience.image}
                        badge={experience.badge}
                      />
                    ))
                  )}
                </CardScroller>
              </Section>
            ))}
        </AnimatedView>
      </ThemeScroller>

      <ActionSheetThemed ref={newBarbersInfoSheetRef} gestureEnabled>
        <View className="p-4 pb-8">
          <ThemedText className="mb-3 text-lg font-semibold">
            {t('experienceNewBarbers')}
          </ThemedText>
          <ThemedText className="text-base leading-6 text-light-subtext dark:text-dark-subtext">
            {t('experienceNewBarbersInfoP1')}
          </ThemedText>
          <ThemedText className="mt-3 text-base leading-6 text-light-subtext dark:text-dark-subtext">
            {t('experienceNewBarbersInfoP2')}
          </ThemedText>
        </View>
      </ActionSheetThemed>
    </>
  );
};

export default ExperienceScreen;
