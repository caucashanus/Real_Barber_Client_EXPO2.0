import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Animated, Pressable } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { ScrollContext } from './_layout';

import { getEmployees, type Employee } from '@/api/employees';
import { useAuth } from '@/contexts/AuthContext';
import { useBarbersRoster } from '@/hooks/useBarbersRoster';
import { useTranslation } from '@/hooks/useTranslation';
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
import { barberDetailHref } from '@/constants/profileDetailRoutes';

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

const ExperienceScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();
  const {
    teamCards,
    loading: teamLoading,
    refreshing: teamRefreshing,
    error: teamError,
  } = useBarbersRoster();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setEmployeesLoading(true);
    setEmployeesError(null);
    getEmployees(apiToken, CLIENT_APP_V1_ENABLED ? {} : { includeReviews: true, reviewsLimit: 1 })
      .then((empList) => {
        setEmployees(Array.isArray(empList) ? empList : Object.values(empList));
      })
      .catch((e) => {
        setEmployeesError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => setEmployeesLoading(false));
  }, [apiToken]);

  const newBarbers = employees.filter(isEmployeeNew).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
    return tb - ta;
  });

  const newBarbersInfoSheetRef = useRef<ActionSheetRef>(null);
  const showNewBarbersSection = newBarbers.length > 0 || employeesLoading;

  return (
    <>
      <ThemeScroller
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="scaleIn" className="mt-4 flex-1">
          <HomeTodayTeamSection
            cards={teamCards}
            loading={teamLoading}
            refreshingAvailability={teamRefreshing}
            error={teamError}
            locale={locale}
            t={t}
            sectionTitleKey="teamPageTitle"
            loadingTextKey="teamPageLoading"
            errorTextKey="teamPageLoadError"
            emptyTextKey="teamPageEmpty"
            introTextKey="teamPageIntro"
            useCardLayout
          />

          {showNewBarbersSection ? (
            <Section
              className="mt-6"
              title={t('experienceNewBarbers')}
              titleSize="lg"
              titleTrailing={
                <Pressable
                  onPress={() => newBarbersInfoSheetRef.current?.show()}
                  hitSlop={8}
                  className="p-1">
                  <Icon name="Info" size={18} className="text-light-subtext dark:text-dark-subtext" />
                </Pressable>
              }>
              <CardScroller space={15} className="mt-1.5">
                {employeesLoading ? (
                  <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                    {t('commonLoading')}
                  </ThemedText>
                ) : null}
                {employeesError ? (
                  <ThemedText className="py-4 text-red-500 dark:text-red-400">
                    {employeesError}
                  </ThemedText>
                ) : null}
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
                      href={barberDetailHref(emp.id)}
                      price=""
                      width={160}
                      imageHeight={160}
                      image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                      badge={t('experienceNewBarbersBadge')}
                    />
                  ))}
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
