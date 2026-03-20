import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import Icon from '@/components/Icon';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
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

function getMonthDays(offset: number): Array<{ value: string; label: string }> {
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
      label: d.toLocaleDateString('cs-CZ', { weekday: 'short', day: '2-digit' }),
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

function groupServicesByCategory(services: ServiceOption[]): Array<{ key: string; name: string; services: ServiceOption[] }> {
  const map = new Map<string, { key: string; name: string; services: ServiceOption[] }>();
  for (const svc of services) {
    const key = svc.category?.id ?? svc.category?.name ?? 'other';
    const name = svc.category?.name ?? 'Ostatní';
    if (!map.has(key)) map.set(key, { key, name, services: [] });
    map.get(key)!.services.push(svc);
  }
  return Array.from(map.values());
}

export default function ReservationCreateScreen() {
  const { apiToken } = useAuth();
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
  const [currentStep, setCurrentStep] = useState(0);
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
  const serviceCategories = useMemo(() => groupServicesByCategory(services), [services]);
  const groupedSlots = useMemo(() => {
    const slots = availability?.availability?.slots ?? [];
    const morning = slots.filter((s) => timeToMinutes(s.start) < 12 * 60);
    const afternoon = slots.filter((s) => timeToMinutes(s.start) >= 12 * 60 && timeToMinutes(s.start) < 17 * 60);
    const evening = slots.filter((s) => timeToMinutes(s.start) >= 17 * 60);
    return { morning, afternoon, evening };
  }, [availability]);
  const monthDays = useMemo(() => getMonthDays(monthOffset), [monthOffset]);
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
    const txt = d.toLocaleDateString('cs-CZ', { month: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }, [monthOffset]);
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

  const onStepChange = (nextStep: number): boolean => {
    setCurrentStep(nextStep);
    return true;
  };

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) return Boolean(data.branchId);
    if (currentStep === 1) return Boolean(data.employeeId);
    if (currentStep === 2) return Boolean(data.itemId);
    if (currentStep === 3) return Boolean(data.date && data.slotStart);
    return true;
  }, [currentStep, data.branchId, data.employeeId, data.itemId, data.date, data.slotStart]);

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

  const selectEmployee = (employeeId: string) => {
    setData((prev) => ({
      ...prev,
      employeeId,
      itemId: '',
      slotStart: '',
      slotEnd: '',
      duration: 0,
    }));
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

  return (
    <>
      <MultiStep
        onComplete={handleCreateBooking}
        onClose={() => router.back()}
        showStepIndicator={false}
        onStepChange={onStepChange}
        isNextDisabled={() => !isCurrentStepValid}
      >
      <Step title="Choose branch">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte pobočku</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Vyberte pobočku, kde chcete rezervaci.
            </ThemedText>
            <Button
              title="Zobrazit mapu"
              variant="outline"
              size="small"
              rounded="full"
              className="self-center mt-4 px-4"
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
                  onPress={() =>
                    setData((prev) => ({
                      ...prev,
                      branchId: branch.id,
                      employeeId: '',
                      itemId: '',
                      slotStart: '',
                      slotEnd: '',
                      duration: 0,
                    }))
                  }
                  style={{ paddingRight: 74 }}
                />
                <Pressable
                  className="absolute right-4 top-4 rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1"
                  onPress={() => {
                    setData((prev) => ({
                      ...prev,
                      branchId: branch.id,
                      employeeId: '',
                      itemId: '',
                      slotStart: '',
                      slotEnd: '',
                      duration: 0,
                    }));
                    setDetailsBranchId(branch.id);
                    setIsBranchDescriptionExpanded(false);
                    branchDetailsSheetRef.current?.show();
                  }}
                >
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    Více
                  </ThemedText>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </Step>

      <Step title="Vyberte specialistu">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte specialistu</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Vyberte holiče, ke kterému chcete vytvořit rezervaci.
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
                    Více
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
              Pro pobočku nejsou dostupní žádní barbeři.
            </ThemedText>
          ) : null}
        </ScrollView>
      </Step>

      <Step title="Vyberte službu">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte službu</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Vyberte službu, kterou chcete rezervovat.
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
                      onPress={() =>
                        setData((prev) => ({
                          ...prev,
                          itemId: service.id,
                          slotStart: '',
                          slotEnd: '',
                          duration: service.duration,
                        }))
                      }
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
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{service.price} Kč</ThemedText>
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
              Pro vybraného barbera nejsou dostupné žádné služby.
            </ThemedText>
          ) : null}
        </ScrollView>
      </Step>

      <Step title="Vyberte datum a čas">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte datum a čas</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Vyberte den a následně dostupný termín.
            </ThemedText>
          </View>
          <View className="flex-row gap-2 mb-4">
            {showTodayChip ? (
              <Chip
                size="lg"
                label="Dnes"
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
                label="Zítra"
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
              V tomto měsíci nejsou žádné volné termíny.
            </ThemedText>
          ) : null}
          <View className="mt-6 mb-2">
            <ThemedText className="text-lg font-semibold">Dostupné časy</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              Vyberte volný čas z dostupných termínů.
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
                <Section title="Ráno" titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.morning.map((slot, index) => {
                      const isSelected = data.slotStart === slot.start && data.slotEnd === slot.end;
                      return (
                        <Pressable
                          key={`m-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                          onPress={() =>
                            setData((prev) => ({
                              ...prev,
                              slotStart: slot.start,
                              slotEnd: slot.end,
                              duration: slot.duration,
                            }))
                          }
                          className={`px-3 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-light-accent dark:bg-dark-accent border-light-accent dark:border-dark-accent'
                              : 'bg-light-secondary dark:bg-dark-secondary border-light-secondary dark:border-dark-secondary'
                          }`}
                        >
                          <ThemedText className={`text-sm ${isSelected ? 'text-white' : ''}`}>{slot.start}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </Section>
              ) : null}
              {groupedSlots.afternoon.length > 0 ? (
                <Section title="Odpoledne" titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.afternoon.map((slot, index) => {
                      const isSelected = data.slotStart === slot.start && data.slotEnd === slot.end;
                      return (
                        <Pressable
                          key={`a-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                          onPress={() =>
                            setData((prev) => ({
                              ...prev,
                              slotStart: slot.start,
                              slotEnd: slot.end,
                              duration: slot.duration,
                            }))
                          }
                          className={`px-3 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-light-accent dark:bg-dark-accent border-light-accent dark:border-dark-accent'
                              : 'bg-light-secondary dark:bg-dark-secondary border-light-secondary dark:border-dark-secondary'
                          }`}
                        >
                          <ThemedText className={`text-sm ${isSelected ? 'text-white' : ''}`}>{slot.start}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </Section>
              ) : null}
              {groupedSlots.evening.length > 0 ? (
                <Section title="Večer" titleSize="md" className="mb-2">
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {groupedSlots.evening.map((slot, index) => {
                      const isSelected = data.slotStart === slot.start && data.slotEnd === slot.end;
                      return (
                        <Pressable
                          key={`e-${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${index}`}
                          onPress={() =>
                            setData((prev) => ({
                              ...prev,
                              slotStart: slot.start,
                              slotEnd: slot.end,
                              duration: slot.duration,
                            }))
                          }
                          className={`px-3 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-light-accent dark:bg-dark-accent border-light-accent dark:border-dark-accent'
                              : 'bg-light-secondary dark:bg-dark-secondary border-light-secondary dark:border-dark-secondary'
                          }`}
                        >
                          <ThemedText className={`text-sm ${isSelected ? 'text-white' : ''}`}>{slot.start}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </Section>
              ) : null}
              {(availability?.availability?.slots?.length ?? 0) === 0 ? (
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Pro vybrané parametry nejsou dostupné žádné termíny.
                </ThemedText>
              ) : null}
            </>
          )}
        </ScrollView>
      </Step>

      <Step title="Review">
        <View className="p-8 flex-1">
          <ThemedText className="text-3xl font-semibold">Review reservation</ThemedText>
          <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1">
            Zkontrolujte vybrane udaje a pokracujte.
          </ThemedText>

          <View className="mt-8 bg-light-secondary dark:bg-dark-secondary rounded-2xl p-4 gap-3">
            <SummaryRow label="Pobocka" value={selectedBranch?.name ?? '—'} />
            <SummaryRow
              label="Barber"
              value={employees.find((e) => e.id === data.employeeId)?.name ?? '—'}
            />
            <SummaryRow
              label="Sluzba"
              value={services.find((s) => s.id === data.itemId)?.name ?? '—'}
            />
            <SummaryRow label="Datum" value={data.date || '—'} />
            <SummaryRow label="Cas" value={data.slotStart && data.slotEnd ? `${data.slotStart} - ${data.slotEnd}` : '—'} />
          </View>

          <Pressable
            className="mt-5 p-4 rounded-xl border border-light-secondary dark:border-dark-secondary"
            onPress={() => router.push('/screens/reservations')}
          >
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext">
              Potvrzenim dokoncite vytvoreni rezervace.
            </ThemedText>
          </Pressable>
          {creatingBooking ? (
            <View className="mt-4 flex-row items-center justify-center">
              <ActivityIndicator size="small" />
              <ThemedText className="ml-2 text-light-subtext dark:text-dark-subtext">Vytvarim rezervaci...</ThemedText>
            </View>
          ) : null}
          {createBookingError ? (
            <ThemedText className="mt-4 text-red-500 dark:text-red-400">{createBookingError}</ThemedText>
          ) : null}
        </View>
      </Step>
      </MultiStep>
      <ActionSheetThemed ref={detailsSheetRef} gestureEnabled>
        <ScrollView className="max-h-[75vh]" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="text-lg font-bold mt-2 mb-2 text-left">
            {detailsEmployee?.name ?? 'Specialista'}
          </ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-5">
            {detailsDescription || 'Bez popisu.'}
          </ThemedText>
          {detailsMedia.length > 0 ? (
            <View className="mb-5">
              <ThemedText className="text-sm font-semibold mb-2">Ukázka práce</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {detailsMedia.map((m, index) => (
                  <View key={`${m.url}-${index}`} className="w-24 h-24 rounded-xl overflow-hidden bg-light-secondary dark:bg-dark-secondary">
                    {m.type === 'video' ? (
                      <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">Video</ThemedText>
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
            title="Zavřít"
            variant="outline"
            onPress={() => detailsSheetRef.current?.hide()}
          />
        </ScrollView>
      </ActionSheetThemed>
      <ActionSheetThemed ref={branchDetailsSheetRef} gestureEnabled>
        <ScrollView className="max-h-[75vh]" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="text-lg font-bold mt-2 mb-2 text-left">
            {detailsBranch?.name ?? 'Pobočka'}
          </ThemedText>
          <ThemedText
            numberOfLines={isBranchDescriptionExpanded ? undefined : 3}
            className="text-sm leading-6 text-light-subtext dark:text-dark-subtext mb-2"
          >
            {detailsBranchDescription || 'Tato pobočka zatím nemá krátké představení.'}
          </ThemedText>
          {detailsBranchDescription ? (
            <Pressable
              className="self-start mb-4 rounded-full bg-light-secondary dark:bg-dark-secondary px-2 py-1"
              onPress={() => setIsBranchDescriptionExpanded((prev) => !prev)}
            >
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {isBranchDescriptionExpanded ? 'Skrýt popis' : 'Zobrazit celý popis'}
              </ThemedText>
            </Pressable>
          ) : (
            <View className="mb-2" />
          )}
          {detailsBranchVideo ? (
            <View className="mb-4 rounded-xl overflow-hidden bg-black">
              <ThemedText className="text-sm font-semibold">Kudy na pobočku?</ThemedText>
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
              <ThemedText className="text-sm font-semibold mb-2">Interiér pobočky</ThemedText>
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
            title="Zavřít"
            variant="outline"
            onPress={() => branchDetailsSheetRef.current?.hide()}
          />
        </ScrollView>
      </ActionSheetThemed>
    </>
  );
}

function SummaryRow(props: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <ThemedText className="text-light-subtext dark:text-dark-subtext">{props.label}</ThemedText>
      <ThemedText className="font-medium">{props.value}</ThemedText>
    </View>
  );
}
