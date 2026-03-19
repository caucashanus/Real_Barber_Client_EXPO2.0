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
import ShowRating from '@/components/ShowRating';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useAuth } from '@/app/contexts/AuthContext';
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

function nextDays(count: number): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const day = d.toLocaleDateString('cs-CZ', { weekday: 'short' });
    const date = d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    out.push({ value, label: `${day} ${date}` });
  }
  return out;
}

export default function ReservationCreateScreen() {
  const { apiToken } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employeesById, setEmployeesById] = useState<Record<string, Employee>>({});
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [loadingEmployeeServices, setLoadingEmployeeServices] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingError, setCreateBookingError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);
  const detailsSheetRef = useRef<ActionSheetRef>(null);
  const [detailsBranchId, setDetailsBranchId] = useState<string | null>(null);
  const branchDetailsSheetRef = useRef<ActionSheetRef>(null);
  const [isBranchDescriptionExpanded, setIsBranchDescriptionExpanded] = useState(false);
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
  const services = useMemo(() => {
    if (employeeServices.length > 0) return employeeServices;
    return getServicesList(selectedBranch);
  }, [selectedBranch, employeeServices]);
  const dayOptions = useMemo(() => nextDays(14), []);

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

  const onStepChange = (nextStep: number): boolean => {
    setStepError(null);
    if (currentStep === 0 && !data.branchId) {
      setStepError('Vyberte pobocku.');
      return false;
    }
    if (currentStep === 1 && !data.employeeId) {
      setStepError('Vyberte barbera.');
      return false;
    }
    if (currentStep === 2 && !data.itemId) {
      setStepError('Vyberte sluzbu.');
      return false;
    }
    if (currentStep === 3 && !data.date) {
      setStepError('Vyberte datum.');
      return false;
    }
    if (currentStep === 4 && !data.slotStart) {
      setStepError('Vyberte cas rezervace.');
      return false;
    }
    setCurrentStep(nextStep);
    return true;
  };

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
          {stepError ? <ThemedText className="text-red-500 mt-2">{stepError}</ThemedText> : null}
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
          {stepError ? <ThemedText className="text-red-500 mt-2">{stepError}</ThemedText> : null}
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
          {services.map((service) => (
            <Selectable
              key={service.id}
              title={service.name}
              description={`${service.duration} min • ${service.price} Kc`}
              selected={data.itemId === service.id}
              showSelectedIndicator={false}
              onPress={() =>
                setData((prev) => ({
                  ...prev,
                  itemId: service.id,
                  slotStart: '',
                  slotEnd: '',
                  duration: 0,
                }))
              }
            />
          ))}
          {services.length === 0 ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              Pro vybraného barbera nejsou dostupné žádné služby.
            </ThemedText>
          ) : null}
          {stepError ? <ThemedText className="text-red-500 mt-2">{stepError}</ThemedText> : null}
        </ScrollView>
      </Step>

      <Step title="Vyberte datum">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte datum</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Vyberte den, kdy chcete přijít.
            </ThemedText>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {dayOptions.map((day) => (
              <Chip
                key={day.value}
                size="lg"
                label={day.label}
                isSelected={data.date === day.value}
                onPress={() =>
                  setData((prev) => ({
                    ...prev,
                    date: day.value,
                    slotStart: '',
                    slotEnd: '',
                    duration: 0,
                  }))
                }
              />
            ))}
          </View>
          {stepError ? <ThemedText className="text-red-500 mt-4">{stepError}</ThemedText> : null}
        </ScrollView>
      </Step>

      <Step title="Vyberte čas">
        <ScrollView className="p-4 px-8">
          <View className="mb-8">
            <ThemedText className="text-3xl font-semibold">Vyberte čas</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
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
              {availability?.availability?.slots?.map((slot) => (
                <Selectable
                  key={`${slot.start}-${slot.end}-${slot.branchId ?? 'any'}`}
                  title={`${slot.start} - ${slot.end}`}
                  description={`${slot.duration} min`}
                  selected={data.slotStart === slot.start && data.slotEnd === slot.end}
                  showSelectedIndicator={false}
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
              {(availability?.availability?.slots?.length ?? 0) === 0 ? (
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Pro vybrané parametry nejsou dostupné žádné termíny.
                </ThemedText>
              ) : null}
            </>
          )}
          {stepError ? <ThemedText className="text-red-500 mt-2">{stepError}</ThemedText> : null}
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
