import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Animated } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { ScrollContext } from './_layout';
import { useAuth } from '@/app/contexts/AuthContext';
import { getEmployees, type Employee } from '@/api/employees';
import LiveIndicator from '@/components/LiveIndicator';

const NEW_BARBERS_DAYS = 30;

/** API uses Cyrillic day names: Sun, Mon, Tue, Wed, Thu, Fri, Sat */
const WEEKDAY_API_KEYS = [
    'Воскресенье',  // 0 Sunday
    'Понедельник',  // 1 Monday
    'Вторник',      // 2 Tuesday
    'Среда',        // 3 Wednesday
    'Четверг',     // 4 Thursday
    'Пятница',     // 5 Friday
    'Суббота',      // 6 Saturday
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
    const ws = emp.workSchedule as { weeklySchedule?: Record<string, Array<{ validFrom?: string; validUntil?: string }>> } | undefined;
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

function hasShiftTomorrow(emp: Employee): boolean {
    const ws = emp.workSchedule as { weeklySchedule?: Record<string, Array<{ validFrom?: string; validUntil?: string }>> } | undefined;
    const weekly = ws?.weeklySchedule;
    if (!weekly || typeof weekly !== 'object') return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayIndex = tomorrow.getDay();
    const dayKey = WEEKDAY_API_KEYS[dayIndex];
    const slots = weekly[dayKey];
    if (!Array.isArray(slots) || slots.length === 0) return false;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    for (const slot of slots) {
        const from = slot.validFrom ? slot.validFrom.slice(0, 10) : '';
        const until = slot.validUntil ? slot.validUntil.slice(0, 10) : '';
        if (from && until && tomorrowStr >= from && tomorrowStr <= until) return true;
    }
    return false;
}

const ExperienceScreen = () => {
    const scrollY = useContext(ScrollContext);
    const { apiToken } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState<string | null>(null);

    useEffect(() => {
        if (!apiToken) return;
        setEmployeesLoading(true);
        setEmployeesError(null);
        getEmployees(apiToken, { includeReviews: true, reviewsLimit: 1 })
            .then((list) => setEmployees(Array.isArray(list) ? list : Object.values(list)))
            .catch((e) => setEmployeesError(e instanceof Error ? e.message : 'Failed to load'))
            .finally(() => setEmployeesLoading(false));
    }, [apiToken]);

    const newBarbers = employees
        .filter(isEmployeeNew)
        .sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
            return tb - ta;
        });

    const barbersAvailableToday = employees.filter(hasShiftToday);

    const allBarbersShuffled = useMemo(
        () => shuffleArray(employees),
        [employees]
    );

    const sections = [
                        {
                            title: "New barbers",
                            experiences: [
                                { 
                                    title: "Rooftop Bar Hopping", 
                                    image: "https://images.pexels.com/photos/13542704/pexels-photo-13542704.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$75",
                                    rating: 4.8,
                                    badge: "New"
                                },
                                { 
                                    title: "Museum Mile Tour", 
                                    image: "https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$45",
                                    rating: 4.9,
                                    badge: "New"
                                },
                                { 
                                    title: "Broadway Behind the Scenes", 
                                    image: "https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?q=80&w=400",
                                    price: "$95",
                                    rating: 4.7
                                },
                                { 
                                    title: "Food Tour in Little Italy", 
                                    image: "https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$65",
                                    rating: 4.6
                                }
                            ]
                        },
                        {
                            title: "Popular barbers available today",
                            experiences: [
                                { 
                                    title: "Street Art Walking Tour", 
                                    image: "https://images.unsplash.com/photo-1503410781609-75b1d892dd28?q=80&w=400",
                                    price: "$35",
                                    rating: 4.9
                                },
                                { 
                                    title: "Craft Beer Experience", 
                                    image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?q=80&w=400",
                                    price: "$55",
                                    rating: 4.7
                                },
                                { 
                                    title: "DUMBO Photo Tour", 
                                    image: "https://images.unsplash.com/photo-1520190282873-afe1285c9a2a?q=80&w=400",
                                    price: "$40",
                                    rating: 4.8
                                },
                                { 
                                    title: "Williamsburg Food Scene", 
                                    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400",
                                    price: "$70",
                                    rating: 4.6
                                }
                            ]
                        },
                        {
                            title: "All barbers",
                            experiences: [
                                { 
                                    title: "Jazz Club Evening", 
                                    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=400",
                                    price: "$60",
                                    rating: 4.9
                                },
                                { 
                                    title: "Soul Food Tour", 
                                    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400",
                                    price: "$50",
                                    rating: 4.8
                                },
                                { 
                                    title: "Gospel Experience", 
                                    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400",
                                    price: "$45",
                                    rating: 4.9
                                },
                                { 
                                    title: "Historic Harlem Tour", 
                                    image: "https://images.pexels.com/photos/9471914/pexels-photo-9471914.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$40",
                                    rating: 4.7
                                }
                            ]
                        },
                        {
                            title: "Best rated barbers",
                            experiences: [
                                { 
                                    title: "Flushing Food Adventure", 
                                    image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?q=80&w=400",
                                    price: "$55",
                                    rating: 4.8
                                },
                                { 
                                    title: "Art District Gallery Hop", 
                                    image: "https://images.pexels.com/photos/161154/stained-glass-spiral-circle-pattern-161154.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$35",
                                    rating: 4.6
                                },
                                { 
                                    title: "Night Market Experience", 
                                    image: "https://images.unsplash.com/photo-1536392706976-e486e2ba97af?q=80&w=400",
                                    price: "$45",
                                    rating: 4.7
                                },
                                { 
                                    title: "Cultural Dance Workshop", 
                                    image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400",
                                    price: "$40",
                                    rating: 4.8
                                }
                            ]
                        },
                        {
                            title: "My favorite barbers",
                            experiences: [
                                { 
                                    title: "Sunset Sail Experience", 
                                    image: "https://images.pexels.com/photos/3346227/pexels-photo-3346227.jpeg?auto=compress&cs=tinysrgb&w=1200",
                                    price: "$95",
                                    rating: 4.9
                                },
                                { 
                                    title: "Helicopter City Tour", 
                                    image: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?q=80&w=400",
                                    price: "$299",
                                    rating: 4.8
                                },
                                { 
                                    title: "Secret Speakeasy Tour", 
                                    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=400",
                                    price: "$85",
                                    rating: 4.7
                                },
                                { 
                                    title: "Urban Photography", 
                                    image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=400",
                                    price: "$65",
                                    rating: 4.8
                                }
                            ]
                        }
                    ];

    return (
            <ThemeScroller
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <AnimatedView animation="scaleIn" className='flex-1 mt-4'>
                    {sections
                        .filter((section) => {
                            if (section.title === 'New barbers') return newBarbers.length > 0 || employeesLoading;
                            if (section.title === 'Popular barbers available today') return barbersAvailableToday.length > 0 || employeesLoading;
                            return true;
                        })
                        .map((section, index) => (
                        <Section
                            key={`barbers-section-${index}`}
                            title={section.title}
                            titleSize="lg"
                            link={section.title === 'All barbers' || section.title === 'New barbers' || section.title === 'Popular barbers available today' ? undefined : '/screens/map'}
                            linkText={section.title === 'All barbers' || section.title === 'New barbers' || section.title === 'Popular barbers available today' ? undefined : 'View all'}
                        >
                            <CardScroller space={15} className='mt-1.5 pb-4'>
                                {section.title === 'New barbers' ? (
                                    <>
                                        {employeesLoading && <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>}
                                        {employeesError && <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>}
                                        {!employeesLoading && !employeesError && newBarbers.map((emp) => (
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
                                                image={emp.avatarUrl ?? require('@/assets/img/room-1.avif')}
                                                badge="New"
                                            />
                                        ))}
                                    </>
                                ) : section.title === 'Popular barbers available today' ? (
                                    <>
                                        {employeesLoading && <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>}
                                        {employeesError && <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>}
                                        {!employeesLoading && !employeesError && barbersAvailableToday.map((emp) => (
                                            <Card
                                                key={emp.id}
                                                title={emp.name}
                                                topLeftBadge={<LiveIndicator />}
                                                titleTrailing={
                                                    <View className="flex-row items-center justify-center gap-2 bg-light-secondary dark:bg-dark-secondary rounded-full px-1.5 py-0.5 min-h-[20px]">
                                                        <ThemedText className="text-[10px] leading-none text-gray-500 dark:text-gray-300">Tomorrow</ThemedText>
                                                        <LiveIndicator variant={hasShiftTomorrow(emp) ? 'green' : 'red'} size="sm" animated={false} />
                                                    </View>
                                                }
                                                rounded="2xl"
                                                hasFavorite
                                                favoriteEntityType="employee"
                                                favoriteEntityId={emp.id}
                                                href={`/screens/barber-detail?id=${emp.id}`}
                                                price=""
                                                width={160}
                                                imageHeight={160}
                                                image={emp.avatarUrl ?? require('@/assets/img/room-1.avif')}
                                            />
                                        ))}
                                    </>
                                ) : section.title === 'All barbers' ? (
                                    <>
                                        {employeesLoading && <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>}
                                        {employeesError && <ThemedText className="py-4 text-red-500 dark:text-red-400">{employeesError}</ThemedText>}
                                        {!employeesLoading && !employeesError && allBarbersShuffled.map((emp) => (
                                            <Card
                                                key={emp.id}
                                                title={emp.name}
                                                rounded="2xl"
                                                hasFavorite
                                                favoriteEntityType="employee"
                                                favoriteEntityId={emp.id}
                                                rating={4.5}
                                                href={`/screens/barber-detail?id=${emp.id}`}
                                                price=""
                                                width={160}
                                                imageHeight={160}
                                                image={emp.avatarUrl ?? require('@/assets/img/room-1.avif')}
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

    );
}


export default ExperienceScreen;