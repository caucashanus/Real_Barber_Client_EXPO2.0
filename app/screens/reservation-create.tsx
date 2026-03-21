import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import MultiStep, { Step } from '@/components/MultiStep';
import Selectable from '@/components/forms/Selectable';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import Icon from '@/components/Icon';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getBranches, type Branch, type BranchEmployee, type BranchService } from '@/api/branches';
import { createBooking, getBookingAvailability, type BookingAvailabilityResponse } from '@/api/bookings';
import { getEmployeeById, getEmployees, type Employee, type EmployeeService } from '@/api/employees';

interface ReservationFlowData {
  branchId: string;
  employeeId: string;
  itemId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
}

function getEmployeesList(branch: Branch | null): BranchEmployee[] {
  if (!branch?.employees) return [];
  if (Array.isArray(branch.employees)) return branch.employees;
  return Object.values(branch.employees);
}

function getServicesList(branch: Branch | null): BranchService[] {
  if (!branch?.services) return [];
  if (Array.isArray(branch.services)) return branch.services;
  return Object.values(branch.services);
}

function getEmployeeServicesList(services: EmployeeService[] | Record<string, EmployeeService> | undefined): EmployeeService[] {
  if (!services) return [];
  if (Array.isArray(services)) return services;
  return Object.values(services);
}

function getBranchImageUrl(branch: Branch): string | null {
  const media = branch.media;
  if (Array.isArray(media) && media.length > 0) {
    const sorted = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstMediaUrl = sorted.find((m) => !!m?.url)?.url;
    if (firstMediaUrl) return firstMediaUrl;
  }
  return branch.imageUrl ?? null;
}

function branchDescription(branch: Branch): string {
  const raw = (branch as { description?: unknown }).description;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim();
}

function getBranchMedia(branch: Branch): Array<{ url: string; type?: 'image' | 'video'; order?: number }> {
  const raw = branch.media;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const url = (item as { url?: unknown }).url;
      const type = (item as { type?: unknown }).type;
      const order = (item as { order?: unknown }).order;
      if (typeof url !== 'string' || url.trim() === '') return null;
      return {
        url,
        type: type === 'video' ? 'video' : 'image',
        order: typeof order === 'number' ? order : undefined,
      };
    })
    .filter((x): x is { url: string; type?: 'image' | 'video'; order?: number } => x != null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Stejná priorita jako `branchCardImage` na home (Top picks / pobočky): média → imageUrl → první služba → fallback. */
function getBranchCardImageSource(branch: Branch | null): string | number {
  if (!branch) return require('@/assets/img/room-1.avif');
  const media = getBranchMedia(branch);
  const firstStill = media.find((m) => m.type !== 'video') ?? media[0];
  if (firstStill?.url) return firstStill.url;
  if (branch.imageUrl) return branch.imageUrl;
  const servicesList = getServicesList(branch);
  const firstWithImage = servicesList.find((s) => s.imageUrl);
  if (firstWithImage?.imageUrl) return firstWithImage.imageUrl;
  return require('@/assets/img/room-1.avif');
}

function employeeDescription(employee: BranchEmployee): string {
  const raw =
    (employee as { description?: unknown }).description ??
    (employee as { bio?: unknown }).bio;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim();
}

function shortEmployeeDescription(employee: BranchEmployee): string {
  const full = employeeDescription(employee);
  if (!full) return '';
  if (full.length <= 55) return full;
  return `${full.slice(0, 55)}...`;
}

function getEmployeeAverageRating(employee: BranchEmployee): number | null {
  const rawReviews = (employee as { reviews?: unknown }).reviews;
  if (!Array.isArray(rawReviews) || rawReviews.length === 0) return null;
  const ratings = rawReviews
    .map((r) => {
      if (!r || typeof r !== 'object') return null;
      const value = (r as { rating?: unknown }).rating;
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    })
    .filter((x): x is number => x != null);
  if (ratings.length === 0) return null;
  const avg = ratings.reduce((sum, n) => sum + n, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
}

function mergeEmployee(base: BranchEmployee, full?: Employee): BranchEmployee {
  if (!full) return base;
  return {
    ...base,
    ...full,
    description:
      (full as { description?: string | null }).description ??
      (base as { description?: string | null }).description,
    reviews:
      (full as { reviews?: unknown }).reviews ??
      (base as { reviews?: unknown }).reviews,
  } as BranchEmployee;
}

function getEmployeeMedia(employee: BranchEmployee): Array<{ url: string; type?: 'image' | 'video' }> {
  const raw = (employee as { media?: unknown }).media;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw as Record<string, unknown>) : [];
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const url = (item as { url?: unknown }).url;
      const type = (item as { type?: unknown }).type;
      if (typeof url !== 'string' || url.trim() === '') return null;
      return {
        url,
        type: type === 'video' ? 'video' : 'image',
      };
    })
    .filter((x): x is { url: string; type?: 'image' | 'video' } => x != null);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthDays(offset: number, dateLocale: string): Array<{ value: string; label: string }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const out: Array<{ value: string; label: string }> = [];
  for (let day = 1; day <= last.getDate(); day += 1) {
    const d = new Date(first.getFullYear(), first.getMonth(), day);
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue;
    out.push({
      value: toIsoDate(d),
      label: d.toLocaleDateString(dateLocale, { weekday: 'short', day: '2-digit' }),
    });
  }
  return out;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function getMonthOffsetFromToday(target: Date): number {
  const now = new Date();
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

function getMonthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

type ServiceOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
  category?: { id?: string; name?: string } | null;
};

function isReservationStepValid(stepIndex: number, d: ReservationFlowData): boolean {
  if (stepIndex === 0) return Boolean(d.branchId);
  if (stepIndex === 1) return Boolean(d.employeeId);
  if (stepIndex === 2) return Boolean(d.itemId);
  if (stepIndex === 3) return Boolean(d.date && d.slotStart);
  return true;
}

function groupServicesByCategory(
  services: ServiceOption[],
  otherCategoryLabel: string
): Array<{ key: string; name: string; services: ServiceOption[] }> {
  const map = new Map<string, { key: string; name: string; services: ServiceOption[] }>();
  for (const svc of services) {
    const key = svc.category?.id ?? svc.category?.name ?? 'other';
    const name = svc.category?.name ?? otherCategoryLabel;
    if (!map.has(key)) map.set(key, { key, name, services: [] });
    map.get(key)!.services.push(svc);
  }
  return Array.from(map.values());
}

export default function ReservationCreateScreen() {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const colors = useThemeColors();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employeesById, setEmployeesById] = useState<Record<string, Employee>>({});
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availableDatesInMonth, setAvailableDatesInMonth] = useState<Set<string>>(new Set());
  const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [loadingEmployeeServices, setLoadingEmployeeServices] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingError, setCreateBookingError] = useState<string | null>(null);
  const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);
  const detailsSheetRef = useRef<ActionSheetRef>(null);
  const [detailsBranchId, setDetailsBranchId] = useState<string | null>(null);
  const branchDetailsSheetRef = useRef<ActionSheetRef>(null);
  const [isBranchDescriptionExpanded, setIsBranchDescriptionExpanded] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [lastSelectedDateByMonth, setLastSelectedDateByMonth] = useState<Record<string, string>>({});
  const [data, setData] = useState<ReservationFlowData>({
    branchId: '',
    employeeId: '',
    itemId: '',
    date: '',
    slotStart: '',
    slotEnd: '',
    duration: 0,
  });

  /** Clear wizard fields for steps after `stepIndex` (used when user goes Back). */
  const resetFlowAfterStep = useCallback((stepIndex: number) => {
    setData((prev) => {
      if (stepIndex < 1) {
        return {
          ...prev,
          employeeId: '',
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        };
      }
      if (stepIndex < 2) {
        return {
          ...prev,
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        };
      }
      if (stepIndex < 3) {
        return {
          ...prev,
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        };
      }
      if (stepIndex < 4) {
        return {
          ...prev,
          slotStart: '',
          slotEnd: '',
          duration: 0,
        };
      }
      return prev;
    });
    if (stepIndex < 3) {
      setLastSelectedDateByMonth({});
    }
    if (stepIndex < 1) {
      setMonthOffset(0);
    }
  }, []);

  const selectBranchId = useCallback((branchId: string) => {
    let branchChanged = false;
    setData((prev) => {
      if (prev.branchId === branchId) return prev;
      branchChanged = true;
      return {
        ...prev,
        branchId,
        employeeId: '',
        itemId: '',
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: 0,
      };
    });
    if (branchChanged) {
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
    }
  }, []);

  const selectEmployee = useCallback((employeeId: string) => {
    setData((prev) => ({
      ...prev,
      employeeId,
      itemId: '',
      date: '',
      slotStart: '',
      slotEnd: '',
      duration: 0,
    }));
    setLastSelectedDateByMonth({});
  }, []);

  const selectServiceOption = useCallback((service: ServiceOption) => {
    setData((prev) => ({
      ...prev,
      itemId: service.id,
      date: '',
      slotStart: '',
      slotEnd: '',
      duration: service.duration,
    }));
    setLastSelectedDateByMonth({});
  }, []);

  useEffect(() => {
    if (!apiToken) {
      setLoadingBranches(false);
      return;
    }
    setLoadingBranches(true);
    Promise.all([
      getBranches(apiToken, { includeReviews: true, reviewsLimit: 9999 }),
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 9999 }).catch(() => [] as Employee[]),
    ])
      .then(([list, employees]) => {
        setBranches(list);
        const map: Record<string, Employee> = {};
        employees.forEach((emp) => {
          if (emp.id) map[emp.id] = emp;
        });
        setEmployeesById(map);
      })
      .catch(() => {
        setBranches([]);
        setEmployeesById({});
      })
      .finally(() => setLoadingBranches(false));
  }, [apiToken]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === data.branchId) ?? null,
    [branches, data.branchId]
  );
  const employees = useMemo(
    () =>
      getEmployeesList(selectedBranch)
        .map((e) => mergeEmployee(e, employeesById[e.id]))
        .filter((e) => e.isActive !== false),
    [selectedBranch, employeesById]
  );
  const services = useMemo<ServiceOption[]>(() => {
    if (employeeServices.length > 0) return employeeServices;
    return getServicesList(selectedBranch);
  }, [selectedBranch, employeeServices]);
  const serviceCategoryOtherLabel = t('serviceCategoryOther');
  const serviceCategories = useMemo(
    () => groupServicesByCategory(services, serviceCategoryOtherLabel),
    [services, serviceCategoryOtherLabel]
  );
  const groupedSlots = useMemo(() => {
    const slots = availability?.availability?.slots ?? [];
    const morning = slots.filter((s) => timeToMinutes(s.start) < 12 * 60);
    const afternoon = slots.filter((s) => timeToMinutes(s.start) >= 12 * 60 && timeToMinutes(s.start) < 17 * 60);
    const evening = slots.filter((s) => timeToMinutes(s.start) >= 17 * 60);
    return { morning, afternoon, evening };
  }, [availability]);
  const monthDays = useMemo(() => getMonthDays(monthOffset, dateLocaleTag), [monthOffset, dateLocaleTag]);
  const visibleMonthDays = useMemo(
    () => monthDays.filter((day) => availableDatesInMonth.has(day.value)),
    [monthDays, availableDatesInMonth]
  );
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const tomorrowIso = useMemo(() => toIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), []);
  const showTodayChip = availableDatesInMonth.has(todayIso);
  const showTomorrowChip = availableDatesInMonth.has(tomorrowIso);
  const monthLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    const txt = d.toLocaleDateString(dateLocaleTag, { month: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }, [monthOffset, dateLocaleTag]);
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return getMonthKeyFromDate(d);
  }, [monthOffset]);

  useEffect(() => {
    if (!apiToken || !data.employeeId) {
      setEmployeeServices([]);
      setLoadingEmployeeServices(false);
      return;
    }
    setLoadingEmployeeServices(true);
    getEmployeeById(apiToken, data.employeeId)
      .then((emp) => {
        setEmployeeServices(getEmployeeServicesList(emp.services));
      })
      .catch(() => setEmployeeServices([]))
      .finally(() => setLoadingEmployeeServices(false));
  }, [apiToken, data.employeeId]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || !data.date) {
      setAvailability(null);
      setAvailabilityError(null);
      return;
    }
    setLoadingAvailability(true);
    setAvailabilityError(null);
    getBookingAvailability(apiToken, {
      employeeId: data.employeeId,
      date: data.date,
      branchId: data.branchId || undefined,
      itemId: data.itemId || undefined,
    })
      .then((res) => setAvailability(res))
      .catch((e) => {
        setAvailability(null);
        setAvailabilityError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => setLoadingAvailability(false));
  }, [apiToken, data.employeeId, data.date, data.branchId, data.itemId]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || monthDays.length === 0) {
      setAvailableDatesInMonth(new Set());
      setLoadingMonthAvailability(false);
      return;
    }
    let cancelled = false;
    setLoadingMonthAvailability(true);
    Promise.all(
      monthDays.map(async (day) => {
        try {
          const res = await getBookingAvailability(apiToken, {
            employeeId: data.employeeId,
            date: day.value,
            branchId: data.branchId || undefined,
            itemId: data.itemId || undefined,
          });
          const count = res?.availability?.slots?.length ?? 0;
          return count > 0 ? day.value : null;
        } catch {
          return null;
        }
      })
    )
      .then((values) => {
        if (cancelled) return;
        const available = values.filter((v): v is string => v != null).sort();
        const next = new Set(available);
        setAvailableDatesInMonth(next);
        const remembered = lastSelectedDateByMonth[currentMonthKey];
        const selectedForMonth = data.date && next.has(data.date) ? data.date : null;
        const rememberedForMonth = remembered && next.has(remembered) ? remembered : null;
        const fallbackFirst = available.length > 0 ? available[0] : null;
        const nextDate = selectedForMonth ?? rememberedForMonth ?? fallbackFirst;

        if (nextDate) {
          setLastSelectedDateByMonth((prev) => {
            if (prev[currentMonthKey] === nextDate) return prev;
            return {
              ...prev,
              [currentMonthKey]: nextDate,
            };
          });
          setData((prev) => {
            if (prev.date === nextDate && prev.slotStart === '' && prev.slotEnd === '' && prev.duration === 0) {
              return prev;
            }
            return {
              ...prev,
              date: nextDate,
              slotStart: '',
              slotEnd: '',
              duration: 0,
            };
          });
        } else {
          setData((prev) => {
            if (prev.date === '' && prev.slotStart === '' && prev.slotEnd === '' && prev.duration === 0) return prev;
            return { ...prev, date: '', slotStart: '', slotEnd: '', duration: 0 };
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMonthAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.employeeId, data.branchId, data.itemId, monthOffset, currentMonthKey]);

  const handleCreateBooking = async () => {
    if (!apiToken || creatingBooking) return;
    setCreateBookingError(null);
    setCreatingBooking(true);
    try {
      const payload = {
        employeeId: data.employeeId,
        branchId: data.branchId,
        itemId: data.itemId,
        date: data.date,
        slotStart: data.slotStart,
        slotEnd: data.slotEnd || undefined,
        notes: '',
      };
      const created = await createBooking(apiToken, payload);
      const createdId =
        (typeof created.id === 'string' ? created.id : undefined) ??
        (created.booking && typeof created.booking.id === 'string' ? created.booking.id : undefined);
      if (createdId) {
        router.replace(`/screens/trip-detail?id=${encodeURIComponent(createdId)}`);
      } else {
        router.replace('/screens/reservations');
      }
    } catch (e) {
      setCreateBookingError(e instanceof Error ? e.message : 'Failed to create booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const selectDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (!Number.isNaN(d.getTime())) {
      setLastSelectedDateByMonth((prev) => ({
        ...prev,
        [getMonthKeyFromDate(d)]: dateValue,
      }));
    }
    setData((prev) => ({
      ...prev,
      date: dateValue,
      slotStart: '',
      slotEnd: '',
      duration: 0,
    }));
  };

  const detailsEmployee = employees.find((e) => e.id === detailsEmployeeId) ?? null;
  const detailsDescription = detailsEmployee ? employeeDescription(detailsEmployee) : '';
  const detailsMedia = detailsEmployee ? getEmployeeMedia(detailsEmployee) : [];
  const detailsBranch = branches.find((b) => b.id === detailsBranchId) ?? null;
  const detailsBranchDescription = detailsBranch ? branchDescription(detailsBranch) : '';
  const detailsBranchMedia = detailsBranch ? getBranchMedia(detailsBranch) : [];
  const detailsBranchImages = detailsBranchMedia.filter((m) => m.type !== 'video');
  const detailsBranchVideo = detailsBranchMedia.find((m) => m.type === 'video');
  const selectedEmployee = employees.find((e) => e.id === data.employeeId) ?? null;
  const selectedService = services.find((s) => s.id === data.itemId) ?? null;
  const selectedEmployeeName = selectedEmployee?.name ?? '—';
  const selectedServiceName = selectedService?.name ?? '—';
  const selectedDateLabel = data.date
    ? new Date(data.date).toLocaleDateString(dateLocaleTag, {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : '—';
  const summaryBranchCardImage = useMemo(
    () => getBranchCardImageSource(selectedBranch),
    [selectedBranch]
  );

  return (
    <>
      <MultiStep
        onComplete={handleCreateBooking}
        onClose={() => router.back()}
        showStepIndicator={false}
        onStepIndexChange={(idx, reason) => {
          if (reason === 'back') {
            resetFlowAfterStep(idx);
          }
        }}
        isNextDisabled={(stepIndex) => !isReservationStepValid(stepIndex, data)}
      >
      <Step title={t('reservationStepBranchTitle')}>
        <ScrollView className="pt-2 pb-4 px-6">
          <View className="mb-3 items-center">
            <Image
              source={require('@/assets/img/reservation-branch.png')}
              className="h-16 w-16"
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View className="mb-5">
            <ThemedText className="text-2xl font-semibold">{t('reservationStepBranchTitle')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('reservationStepBranchSubtitle')}
            </ThemedText>
            <Button
              title={t('reservationShowMap')}
              variant="outline"
              size="small"
              rounded="full"
              className="self-center mt-2 px-4"
              href="/screens/map"
            />
          </View>
          {loadingBranches ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            branches.map((branch) => (
              <View key={branch.id} className="mb-2">
                <Selectable
                  title={branch.name}
                  description={branch.address ?? ''}
                  customIcon={
                    getBranchImageUrl(branch) ? (
                      <Image
                        source={{ uri: getBranchImageUrl(branch)! }}
                        className="w-12 h-12 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <Avatar size="sm" name={branch.name} />
                    )
                  }
                  className="relative"
                  selected={data.branchId === branch.id}
                  showSelectedIndicator={false}
                  onPress={() => selectBranchId(branch.id)}
                  style={{ paddingRight: 74 }}
                />
                <Pressable
                  className="absolute right-4 top-4 rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1"
                  onPress={() => {
                    selectBranchId(branch.id);
                    setDetailsBranchId(branch.id);
                    setIsBranchDescriptionExpanded(false);
                    branchDetailsSheetRef.current?.show();
                  }}
                >
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {t('reservationMore')}
                  </ThemedText>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </Step>

      <Step title={t('reservationStepEmployeeTitle')}>
        <ScrollView className="pt-2 pb-4 px-6">
          <View className="mb-3 items-center">
            <Image
              source={require('@/assets/img/reservation-specialist.png')}
              className="h-16 w-16"
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View className="mb-5">
            <ThemedText className="text-2xl font-semibold">{t('reservationStepEmployeeTitle')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('reservationStepEmployeeSubtitle')}
            </ThemedText>
          </View>
          {employees.map((emp) => (
            <View key={emp.id} className="mb-2">
              <Selectable
                title={emp.name}
                description={shortEmployeeDescription(emp)}
                descriptionClassName="text-xs"
                customIcon={
                  <View className="h-12 w-12 items-center justify-center">
                    <Avatar size="sm" src={emp.avatarUrl ?? undefined} name={emp.name} />
                  </View>
                }
                className="relative"
                selected={data.employeeId === emp.id}
                showSelectedIndicator={false}
                onPress={() => selectEmployee(emp.id)}
                style={{ paddingRight: employeeDescription(emp) ? 74 : undefined }}
              />
              {employeeDescription(emp) ? (
                <Pressable
                  className="absolute right-4 top-4 rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1"
                  onPress={() => {
                    selectEmployee(emp.id);
                    setDetailsEmployeeId(emp.id);
                    detailsSheetRef.current?.show();
                  }}
                >
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {t('reservationMore')}
                  </ThemedText>
                </Pressable>
              ) : null}
              {getEmployeeAverageRating(emp) != null ? (
                <View className="ml-16 mt-1 flex-row items-center gap-2">
                  <ShowRating rating={getEmployeeAverageRating(emp)!} size="sm" displayMode="stars" />
                  <View className="bg-light-secondary dark:bg-dark-secondary rounded-full px-2 py-1">
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      {getEmployeeAverageRating(emp)!.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </View>
          ))}
          {employees.length === 0 ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationNoBarbers')}
            </ThemedText>
          ) : null}
        </ScrollView>
      </Step>

      <Step title={t('reservationStepServiceTitle')}>
        <ScrollView className="pt-2 pb-4 px-6">
          <View className="mb-3 items-center">
            <Image
              source={require('@/assets/img/reservation-service.png')}
              className="h-16 w-16"
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View className="mb-5">
            <ThemedText className="text-2xl font-semibold">{t('reservationStepServiceTitle')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('reservationStepServiceSubtitle')}
            </ThemedText>
          </View>
          {loadingEmployeeServices ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null}
          {serviceCategories.map((category) => (
            <Section key={category.key} title={category.name} titleSize="lg" className="mb-4">
              <CardScroller className="mt-1.5 pb-1" space={12}>
                {category.services.map((service) => {
                  const isSelected = data.itemId === service.id;
                  return (
                    <Pressable
                      key={service.id}
                      onPress={() => selectServiceOption(service)}
                      className="w-[160px] active:opacity-80"
                    >
                      <View
                        className="rounded-2xl overflow-hidden"
                        style={isSelected ? { borderColor: colors.highlight, borderWidth: 2 } : undefined}
                      >
                        <Image
                          source={service.imageUrl ? { uri: service.imageUrl } : require('@/assets/img/room-1.avif')}
                          className="w-[160px] h-[140px]"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="py-2 w-full flex-row items-center justify-between gap-2">
                        <ThemedText className="text-sm font-medium flex-1 min-w-0" numberOfLines={1}>{service.name}</ThemedText>
                        <View className="self-start rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1">
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {service.price} {t('reservationCurrencySuffix')}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </CardScroller>
            </Section>
          ))}
          {services.length === 0 ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationNoServices')}
            </ThemedText>
          ) : null}
        </ScrollView>
      </Step>

      <Step title={t('reservationStepDatetimeTitle')}>
        <ScrollView className="pt-2 pb-4 px-6">
          <View className="mb-3 items-center">
            <Image
              source={require('@/assets/img/reservation-time.png')}
              className="h-16 w-16"
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View className="mb-5">
            <ThemedText className="text-2xl font-semibold">{t('reservationStepDatetimeTitle')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('reservationStepDatetimeSubtitle')}
            </ThemedText>
          </View>
          <View className="flex-row gap-2 mb-4">
            {showTodayChip ? (
              <Chip
                size="lg"
                label={t('reservationToday')}
                isSelected={data.date === todayIso}
                onPress={() => {
                  const target = new Date();
                  setMonthOffset(Math.max(0, getMonthOffsetFromToday(target)));
                  selectDate(toIsoDate(target));
                }}
              />
            ) : null}
            {showTomorrowChip ? (
              <Chip
                size="lg"
                label={t('reservationTomorrow')}
                isSelected={data.date === tomorrowIso}
                onPress={() => {
                  const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  setMonthOffset(Math.max(0, getMonthOffsetFromToday(target)));
                  selectDate(toIsoDate(target));
                }}
              />
            ) : null}
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              disabled={monthOffset === 0}
              onPress={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
              className={`rounded-full p-2 ${monthOffset === 0 ? 'opacity-40' : 'opacity-100'}`}
            >
              <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
            </Pressable>
            <ThemedText className="text-base font-semibold">{monthLabel}</ThemedText>
            <Pressable
              onPress={() => setMonthOffset((prev) => prev + 1)}
              className="rounded-full p-2"
            >
              <Icon name="ChevronRight" size={24} className="translate-x-px" />
            </Pressable>
          </View>
          {loadingMonthAvailability ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {visibleMonthDays.map((day) => (
              <Chip
                key={day.value}
                size="lg"
                label={day.label}
                isSelected={data.date === day.value}
                onPress={() => selectDate(day.value)}
              />
            ))}
          </View>
          {!loadingMonthAvailability && visibleMonthDays.length === 0 ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">
              {t('reservationNoSlotsMonth')}
            </ThemedText>
          ) : null}
          <View className="mt-6 mb-2">
            <ThemedText className="text-lg font-semibold">{t('reservationAvailableTimes')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationAvailableTimesSubtitle')}
            </ThemedText>
          </View>
          {loadingAvailability ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : availabilityError ? (
            <ThemedText className="text-red-500">{availabilityError}</ThemedText>
          ) : (
            <>
              {groupedSlots.morning.length > 0 ? (
                <Section title={t('reservationMorning')} titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.morning.map((slot, index) => (
                      <Chip
                        key={`m-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                        size="lg"
                        label={slot.start}
                        isSelected={data.slotStart === slot.start && data.slotEnd === slot.end}
                        onPress={() =>
                          setData((prev) => ({
                            ...prev,
                            slotStart: slot.start,
                            slotEnd: slot.end,
                            duration: slot.duration,
                          }))
                        }
                      />
                    ))}
                  </View>
                </Section>
              ) : null}
              {groupedSlots.afternoon.length > 0 ? (
                <Section title={t('reservationAfternoon')} titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.afternoon.map((slot, index) => (
                      <Chip
                        key={`a-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                        size="lg"
                        label={slot.start}
                        isSelected={data.slotStart === slot.start && data.slotEnd === slot.end}
                        onPress={() =>
                          setData((prev) => ({
                            ...prev,
                            slotStart: slot.start,
                            slotEnd: slot.end,
                            duration: slot.duration,
                          }))
                        }
                      />
                    ))}
                  </View>
                </Section>
              ) : null}
              {groupedSlots.evening.length > 0 ? (
                <Section title={t('reservationEvening')} titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.evening.map((slot, index) => (
                      <Chip
                        key={`e-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                        size="lg"
                        label={slot.start}
                        isSelected={data.slotStart === slot.start && data.slotEnd === slot.end}
                        onPress={() =>
                          setData((prev) => ({
                            ...prev,
                            slotStart: slot.start,
                            slotEnd: slot.end,
                            duration: slot.duration,
                          }))
                        }
                      />
                    ))}
                  </View>
                </Section>
              ) : null}
              {(availability?.availability?.slots?.length ?? 0) === 0 ? (
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('reservationNoSlotsSelection')}
                </ThemedText>
              ) : null}
            </>
          )}
        </ScrollView>
      </Step>

      <Step title={t('reservationSummaryTitle')}>
        <ScrollView className="flex-1 px-global pb-6 pt-2" showsVerticalScrollIndicator={false}>
          <View className="mb-3 items-center">
            <Image
              source={require('@/assets/img/reservation-summary.png')}
              className="h-16 w-16"
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <ThemedText className="text-2xl font-bold">{t('reservationSummaryTitle')}</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
            {t('reservationSummarySubtitle')}
          </ThemedText>

          <View className="mt-3 p-3 rounded-xl bg-light-accent/10 dark:bg-dark-accent/15 border border-light-accent/25 dark:border-dark-accent/30">
            <ThemedText className="text-center text-sm font-medium text-light-text dark:text-dark-text">
              {t('reservationSummaryConfirmHint')}
            </ThemedText>
          </View>

          <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('reservationSummaryBranch')} titleSize="lg" className="pt-3 pb-1">
            <View className="mt-2 rounded-2xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
              <Image
                source={
                  typeof summaryBranchCardImage === 'number'
                    ? summaryBranchCardImage
                    : { uri: summaryBranchCardImage }
                }
                className="w-full h-40"
                resizeMode="cover"
              />
              <View className="p-3">
                <ThemedText className="text-base font-semibold">{selectedBranch?.name ?? '—'}</ThemedText>
                {selectedBranch?.address ? (
                  <View className="flex-row items-start mt-1.5">
                    <Icon name="MapPin" size={14} className="mr-1.5 mt-0.5 text-light-subtext dark:text-dark-subtext" />
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext flex-1">
                      {selectedBranch.address}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </Section>

          <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('reservationSummaryWithSpecialist')} titleSize="lg" className="pt-3 pb-1">
            <View className="flex-row items-center mt-2">
              {selectedEmployee ? (
                <Avatar size="md" src={selectedEmployee.avatarUrl ?? undefined} name={selectedEmployee.name} />
              ) : (
                <View className="w-12 h-12 rounded-full bg-light-secondary dark:bg-dark-secondary items-center justify-center">
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">—</ThemedText>
                </View>
              )}
              <View className="ml-3 flex-1 min-w-0">
                <ThemedText className="text-base font-semibold" numberOfLines={1}>
                  {selectedEmployeeName}
                </ThemedText>
                {selectedServiceName !== '—' ? (
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-0.5" numberOfLines={2}>
                    {selectedServiceName}
                    {selectedService ? ` · ${selectedService.price} ${t('reservationCurrencySuffix')}` : ''}
                  </ThemedText>
                ) : (
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-0.5">—</ThemedText>
                )}
              </View>
            </View>
          </Section>

          <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('reservationSummaryAppointment')} titleSize="lg" className="pt-3 pb-1">
            <ThemedText className="text-base font-semibold mt-2">{selectedDateLabel}</ThemedText>
            <View className="flex-row items-center justify-between bg-light-secondary dark:bg-dark-secondary rounded-xl p-3 mt-2">
              <View>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{t('reservationSummaryFrom')}</ThemedText>
                <ThemedText className="text-base font-semibold">{data.slotStart || '—'}</ThemedText>
              </View>
              <View className="items-end">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{t('reservationSummaryTo')}</ThemedText>
                <ThemedText className="text-base font-semibold">{data.slotEnd || '—'}</ThemedText>
              </View>
            </View>
            {data.duration > 0 ? (
              <View className="flex-row items-center justify-between pt-2.5">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {t('reservationSummaryEstimatedDuration')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{data.duration} min</ThemedText>
              </View>
            ) : null}
          </Section>

          {creatingBooking ? (
            <View className="mt-3 flex-row items-center justify-center">
              <ActivityIndicator size="small" />
              <ThemedText className="ml-2 text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationSummaryCreating')}
              </ThemedText>
            </View>
          ) : null}
          {createBookingError ? (
            <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{createBookingError}</ThemedText>
          ) : null}
        </ScrollView>
      </Step>
      </MultiStep>
      <ActionSheetThemed ref={detailsSheetRef} gestureEnabled>
        <ScrollView className="max-h-[75vh]" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="text-lg font-bold mt-2 mb-2 text-left">
            {detailsEmployee?.name ?? t('sheetSpecialistFallback')}
          </ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-5">
            {detailsDescription || t('sheetNoBio')}
          </ThemedText>
          {detailsMedia.length > 0 ? (
            <View className="mb-5">
              <ThemedText className="text-sm font-semibold mb-2">{t('sheetPortfolio')}</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {detailsMedia.map((m, index) => (
                  <View key={`${m.url}-${index}`} className="w-24 h-24 rounded-xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
                    {m.type === 'video' ? (
                      <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                          {t('sheetVideoLabel')}
                        </ThemedText>
                      </View>
                    ) : (
                      <Image source={{ uri: m.url }} className="w-full h-full" resizeMode="cover" />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Button
            title={t('sheetClose')}
            variant="outline"
            onPress={() => detailsSheetRef.current?.hide()}
          />
        </ScrollView>
      </ActionSheetThemed>
      <ActionSheetThemed ref={branchDetailsSheetRef} gestureEnabled>
        <ScrollView className="max-h-[75vh]" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="text-lg font-bold mt-2 mb-2 text-left">
            {detailsBranch?.name ?? t('sheetBranchFallback')}
          </ThemedText>
          <ThemedText
            numberOfLines={isBranchDescriptionExpanded ? undefined : 3}
            className="text-sm leading-6 text-light-subtext dark:text-dark-subtext mb-2"
          >
            {detailsBranchDescription || t('sheetBranchNoIntro')}
          </ThemedText>
          {detailsBranchDescription ? (
            <Pressable
              className="self-start mb-4 rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1"
              onPress={() => setIsBranchDescriptionExpanded((prev) => !prev)}
            >
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {isBranchDescriptionExpanded ? t('sheetHideDescription') : t('sheetShowFullDescription')}
              </ThemedText>
            </Pressable>
          ) : (
            <View className="mb-2" />
          )}
          {detailsBranchVideo ? (
            <View className="mb-4 rounded-xl overflow-hidden bg-black">
              <ThemedText className="text-sm font-semibold">{t('sheetHowToBranch')}</ThemedText>
              <Video
                source={{ uri: detailsBranchVideo.url }}
                style={{ width: '100%', height: 220 }}
                resizeMode={ResizeMode.COVER}
                useNativeControls
                shouldPlay
                isLooping
                isMuted
              />
            </View>
          ) : null}
          {detailsBranchImages.length > 0 ? (
            <View className="mb-5">
              <ThemedText className="text-sm font-semibold mb-2">{t('sheetBranchInterior')}</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {detailsBranchImages.map((m, index) => (
                  <View key={`${m.url}-${index}`} className="w-24 h-24 rounded-xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
                    <Image source={{ uri: m.url }} className="w-full h-full" resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Button
            title={t('sheetClose')}
            variant="outline"
            onPress={() => branchDetailsSheetRef.current?.hide()}
          />
        </ScrollView>
      </ActionSheetThemed>
    </>
  );
}
