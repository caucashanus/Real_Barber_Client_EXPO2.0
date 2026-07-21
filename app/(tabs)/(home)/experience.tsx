import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Pressable } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { ScrollContext } from './_layout';

import { getEmployees, type Employee } from '@/api/employees';
import { getClientReviewsList, type ClientReviewListItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { useHomeTodayTeam } from '@/app/hooks/useHomeTodayTeam';
import { useTranslation } from '@/app/hooks/useTranslation';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AnimatedView from '@/components/AnimatedView';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

const NEW_BARBERS_DAYS = 30;

function isEmployeeNew(emp: Employee): boolean {
  const createdAt = emp.createdAt;
  if (!createdAt || typeof createdAt !== 'string') return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const now = Date.now();
  const limitMs = NEW_BARBERS_DAYS * 24 * 60 * 60 * 1000;
  return now - created <= limitMs;
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
  'All barbers': 'experienceAllBarbers',
  'Best rated barbers': 'experienceBestRated',
};

const ExperienceScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();
  const {
    cards: todayTeamCards,
    loading: todayTeamLoading,
    refreshingAvailability: todayTeamRefreshingAvailability,
    error: todayTeamError,
  } = useHomeTodayTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeReviewsList, setEmployeeReviewsList] = useState<ClientReviewListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setEmployeesLoading(true);
    setEmployeesError(null);
    Promise.all([
      getEmployees(apiToken, CLIENT_APP_V1_ENABLED ? {} : { includeReviews: true, reviewsLimit: 1 }),
      CLIENT_APP_V1_ENABLED
        ? Promise.resolve({ reviews: [] as ClientReviewListItem[] })
        : getClientReviewsList(apiToken, { entityType: 'employee', limit: 500 }),
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

  const newBarbers = employees.filter(isEmployeeNew).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
    return tb - ta;
  });

  const allBarbersShuffled = useMemo(() => shuffleArray(employees), [employees]);

  const { bestRatedBarbers, employeeAverageRating } = useMemo(() => {
    if (CLIENT_APP_V1_ENABLED) {
      const withRating = employees.filter(
        (emp) => typeof emp.averageRating === 'number' && (emp.reviewCount ?? 0) > 0
      );
      withRating.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      const ratingMap: Record<string, number> = {};
      for (const emp of employees) {
        if (typeof emp.averageRating === 'number') ratingMap[emp.id] = emp.averageRating;
      }
      return { bestRatedBarbers: withRating, employeeAverageRating: ratingMap };
    }

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
  ];

  const visibleSections = sections.filter((section) => {
    if (section.title === 'New barbers') return newBarbers.length > 0 || employeesLoading;
    if (section.title === 'Best rated barbers')
      return bestRatedBarbers.length > 0 || employeesLoading;
    return true;
  });
  const leadingSections = visibleSections.slice(0, -1);
  const lastSection = visibleSections.at(-1);

  const renderBarberSectionCards = (section: (typeof sections)[number]) => {
    if (section.title === 'New barbers') {
      return (
        <>
          {employeesLoading && (
            <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          )}
          {employeesError && (
            <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>
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
      );
    }

    if (section.title === 'All barbers') {
      return (
        <>
          {employeesLoading && (
            <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          )}
          {employeesError && (
            <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>
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
      );
    }

    if (section.title === 'Best rated barbers') {
      return (
        <>
          {employeesLoading && (
            <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          )}
          {employeesError && (
            <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>
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
      );
    }

    return null;
  };

  const renderBarberSectionTitleTrailing = (sectionTitle: string) =>
    sectionTitle === 'New barbers' ? (
      <Pressable
        onPress={() => newBarbersInfoSheetRef.current?.show()}
        hitSlop={8}
        className="p-1">
        <Icon name="Info" size={18} className="text-light-subtext dark:text-dark-subtext" />
      </Pressable>
    ) : undefined;

  return (
    <>
      <ThemeScroller
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="scaleIn" className="mt-4 flex-1">
          <HomeTodayTeamSection
            cards={todayTeamCards}
            loading={todayTeamLoading}
            refreshingAvailability={todayTeamRefreshingAvailability}
            error={todayTeamError}
            locale={locale}
            t={t}
          />

          {leadingSections.map((section) => (
            <Section
              key={section.title}
              className="mt-6"
              title={
                SECTION_TITLE_KEYS[section.title]
                  ? t(SECTION_TITLE_KEYS[section.title] as TranslationKey)
                  : section.title
              }
              titleSize="lg"
              titleTrailing={renderBarberSectionTitleTrailing(section.title)}>
              <CardScroller space={15} className="mt-1.5 pb-4">
                {renderBarberSectionCards(section)}
              </CardScroller>
            </Section>
          ))}

          {lastSection ? (
            <Section
              title={
                SECTION_TITLE_KEYS[lastSection.title]
                  ? t(SECTION_TITLE_KEYS[lastSection.title] as TranslationKey)
                  : lastSection.title
              }
              titleSize="lg"
              className="mt-6"
              titleTrailing={renderBarberSectionTitleTrailing(lastSection.title)}>
              <CardScroller space={15} className="mt-1.5 pb-4">
                {renderBarberSectionCards(lastSection)}
              </CardScroller>
            </Section>
          ) : null}
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
