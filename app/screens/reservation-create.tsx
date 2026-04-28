import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {View, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import { Image } from 'expo-image';
import { ActionSheetRef } from 'react-native-actions-sheet';

import {
  createBooking,
  getBookingAvailability,
  type BookingAvailabilityResponse,
} from '@/api/bookings';
import {
  getBranches,
  getBranchById,
  type Branch,
  type BranchEmployee,
} from '@/api/branches';
import {
  getEmployeeById,
  getEmployees,
  type Employee,
  type EmployeeDetail,
  type EmployeeBranch,
  type EmployeeService,
} from '@/api/employees';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import MultiStep, { Step } from '@/components/MultiStep';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';
import Selectable from '@/components/forms/Selectable';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import { isEmployeePubliclyBookable } from '@/utils/employeePublicBooking';

interface ReservationFlowData {
  branchId: string;
  employeeId: string;
  itemId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
}

type ServiceOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
  category?: { id?: string; name?: string } | null;
};

function getEmployeesList(branch: Branch | null): BranchEmployee[] {
  if (!branch?.employees) return [];
  if (Array.isArray(branch.employees)) return branch.employees;
  return Object.values(branch.employees);
}

function flattenApiRecord(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>);
  return [];
}

/** Služby / ceník u pobočky – CRM může posílat různé klíče (services, items, employeeItemPrices, …). */
function collectBranchServiceRows(branch: Branch | null): unknown[] {
  if (!branch) return [];
  const b = branch as Record<string, unknown>;
  const keys = [
    'services',
    'items',
    'itemPrices',
    'employeeItemPrices',
    'branchItemPrices',
    'branchServices',
  ];
  const out: unknown[] = [];
  for (const key of keys) {
    out.push(...flattenApiRecord(b[key]));
  }
  if (out.length > 0) return out;
  return flattenApiRecord(b.services);
}

function strVal(v: unknown): string {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : '';
}

function numVal(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Minimální cena z více záznamů API; kladné hodnoty mají přednost před 0 (chybějící cena). */
function mergeServiceMinPrice(a: number, b: number): number {
  const pair = [a, b].filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (pair.length === 0) return 0;
  const positive = pair.filter((n) => n > 0);
  if (positive.length > 0) return Math.min(...positive);
  return Math.min(...pair);
}

function normalizeBranchServiceRow(
  raw: unknown,
  index: number
): { option: ServiceOption; employeeId?: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nestedItem =
    r.item && typeof r.item === 'object' ? (r.item as Record<string, unknown>) : null;
  const nestedService =
    r.service && typeof r.service === 'object' ? (r.service as Record<string, unknown>) : null;

  let itemId =
    strVal(r.id) || strVal(r.itemId) || (nestedItem ? strVal(nestedItem.id) : '') || (nestedService ? strVal(nestedService.id) : '');
  const name =
    strVal(r.name) ||
    (nestedItem ? strVal(nestedItem.name) : '') ||
    (nestedService ? strVal(nestedService.name) : '');

  const price = numVal(r.price ?? r.amount ?? nestedItem?.price ?? nestedService?.price, 0);
  const duration = numVal(
    r.duration ?? r.lengthMinutes ?? nestedItem?.duration ?? nestedService?.duration,
    0
  );
  const imageUrl =
    (typeof r.imageUrl === 'string' && r.imageUrl) ||
    (nestedItem && typeof nestedItem.imageUrl === 'string' ? nestedItem.imageUrl : undefined) ||
    (nestedService && typeof nestedService.imageUrl === 'string'
      ? nestedService.imageUrl
      : undefined) ||
    null;

  let employeeId: string | undefined;
  const em = r.employee;
  if (em && typeof em === 'object') {
    const id = (em as { id?: unknown }).id;
    if (typeof id === 'string' && id.trim()) employeeId = id.trim();
  }
  if (!employeeId && typeof r.employeeId === 'string' && r.employeeId.trim())
    employeeId = r.employeeId.trim();

  let category: ServiceOption['category'] | null = null;
  const cat = r.category ?? nestedItem?.category ?? nestedService?.category;
  if (cat && typeof cat === 'object') {
    const c = cat as Record<string, unknown>;
    const cid = strVal(c.id);
    const cname = strVal(c.name);
    if (cid || cname) category = { id: cid || undefined, name: cname || undefined };
  } else if (typeof cat === 'string' && cat) {
    category = { id: cat, name: cat };
  }

  if (!itemId && name && employeeId) itemId = `__row:${employeeId}:${name}:${index}`;
  if (!itemId) return null;

  const option: ServiceOption = {
    id: itemId,
    name: name || itemId,
    imageUrl,
    price,
    duration,
    category: category ?? undefined,
  };
  return { option, employeeId };
}

function getEmployeeBranchesList(employee: Pick<EmployeeDetail, 'branches'>): EmployeeBranch[] {
  const b = employee.branches;
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Object.values(b);
}

function getEmployeeServicesList(
  services: EmployeeService[] | Record<string, EmployeeService> | undefined
): EmployeeService[] {
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

function getBranchMedia(
  branch: Branch
): { url: string; type?: 'image' | 'video'; order?: number }[] {
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
  if (!branch) return require('@/assets/img/barbers.png');
  const media = getBranchMedia(branch);
  const firstStill = media.find((m) => m.type !== 'video') ?? media[0];
  if (firstStill?.url) return firstStill.url;
  if (branch.imageUrl) return branch.imageUrl;
  const pick = buildBranchServicePickerData(branch).options.find((s) => s.imageUrl);
  if (pick?.imageUrl) return pick.imageUrl;
  return require('@/assets/img/barbers.png');
}

function employeeDescription(employee: BranchEmployee): string {
  const raw =
    (employee as { description?: unknown }).description ?? (employee as { bio?: unknown }).bio;
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
    reviews: (full as { reviews?: unknown }).reviews ?? (base as { reviews?: unknown }).reviews,
  } as BranchEmployee;
}

function getEmployeeMedia(employee: BranchEmployee): { url: string; type?: 'image' | 'video' }[] {
  const raw = (employee as { media?: unknown }).media;
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'object'
      ? Object.values(raw as Record<string, unknown>)
      : [];
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

function getMonthDays(offset: number, dateLocale: string): { value: string; label: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const out: { value: string; label: string }[] = [];
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

function isReservationStepValid(stepIndex: number, d: ReservationFlowData): boolean {
  if (stepIndex === 0) return Boolean(d.branchId);
  if (stepIndex === 1) return Boolean(d.itemId);
  if (stepIndex === 2) return Boolean(d.employeeId);
  if (stepIndex === 3) return Boolean(d.date && d.slotStart);
  return true;
}

/** Služby nabízené na pobočce + mapa „kdo službu dělá“ (pro krok holič). */
function buildBranchServicePickerData(branch: Branch | null): {
  options: ServiceOption[];
  offerersByServiceId: Map<string, Set<string>>;
} {
  if (!branch) return { options: [], offerersByServiceId: new Map() };
  const rows = collectBranchServiceRows(branch);
  const offerersByServiceId = new Map<string, Set<string>>();
  const unique = new Map<string, ServiceOption>();

  rows.forEach((raw, idx) => {
    const parsed = normalizeBranchServiceRow(raw, idx);
    if (!parsed) return;
    const { option, employeeId } = parsed;
    if (employeeId) {
      if (!offerersByServiceId.has(option.id)) offerersByServiceId.set(option.id, new Set());
      offerersByServiceId.get(option.id)!.add(employeeId);
    }
    if (!unique.has(option.id)) {
      unique.set(option.id, option);
    } else {
      const prev = unique.get(option.id)!;
      unique.set(option.id, { ...prev, price: mergeServiceMinPrice(prev.price, option.price) });
    }
  });

  return {
    options: Array.from(unique.values()),
    offerersByServiceId,
  };
}

function findServiceOptionOnBranch(branch: Branch | null, itemId: string): ServiceOption | null {
  if (!branch || !itemId) return null;
  return buildBranchServicePickerData(branch).options.find((s) => s.id === itemId) ?? null;
}

type ServiceCategoryGroup = { key: string; name: string; services: ServiceOption[] };

/** Seskupí služby podle `category` (pořadí = první výskyt v seznamu). Bez kategorie → jedna skupina `otherLabel`. */
function groupServicesByCategory(
  services: ServiceOption[],
  otherLabel: string
): ServiceCategoryGroup[] {
  const order: string[] = [];
  const titles = new Map<string, string>();
  const buckets = new Map<string, ServiceOption[]>();

  for (const s of services) {
    const c = s.category;
    const id = c?.id?.trim();
    const nm = c?.name?.trim();
    const hasCategory = Boolean(id || nm);
    const key = id ?? (nm ? `name:${nm}` : '__other');
    const title = hasCategory ? nm || id || otherLabel : otherLabel;

    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
      titles.set(key, title);
    }
    buckets.get(key)!.push(s);
  }

  return order.map((key) => ({
    key,
    name: titles.get(key) ?? otherLabel,
    services: buckets.get(key) ?? [],
  }));
}

type BarberEntryMode = 'none' | 'single' | 'multi' | 'branch' | 'service';

function trimParam(v: string | undefined): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t !== '' ? t : undefined;
}

export default function ReservationCreateScreen() {
  const params = useLocalSearchParams<{
    employeeId?: string;
    branchId?: string;
    itemId?: string;
    /** Volitelný název služby z detailu (zobrazení ve shrnutí, když není v seznamu u holiče). */
    itemName?: string;
  }>();
  const presetEmployeeId = trimParam(params.employeeId);
  const presetBranchId = trimParam(params.branchId);
  const presetItemId = trimParam(params.itemId);
  const presetItemName = trimParam(params.itemName);

  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const colors = useThemeColors();
  const [branches, setBranches] = useState<Branch[]>([]);
  const branchesRef = useRef<Branch[]>([]);
  branchesRef.current = branches;
  const [employeesById, setEmployeesById] = useState<Record<string, Employee>>({});
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availableDatesInMonth, setAvailableDatesInMonth] = useState<Set<string>>(new Set());
  const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingError, setCreateBookingError] = useState<string | null>(null);
  const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);
  const detailsSheetRef = useRef<ActionSheetRef>(null);
  const [detailsBranchId, setDetailsBranchId] = useState<string | null>(null);
  const branchDetailsSheetRef = useRef<ActionSheetRef>(null);
  const [isBranchDescriptionExpanded, setIsBranchDescriptionExpanded] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [lastSelectedDateByMonth, setLastSelectedDateByMonth] = useState<Record<string, string>>(
    {}
  );
  const [data, setData] = useState<ReservationFlowData>({
    branchId: '',
    employeeId: '',
    itemId: '',
    date: '',
    slotStart: '',
    slotEnd: '',
    duration: 0,
  });

  const [barberEntryMode, setBarberEntryMode] = useState<BarberEntryMode>('none');
  const [barberBootstrap, setBarberBootstrap] = useState<'pending' | 'ready' | 'error'>(() =>
    presetEmployeeId || presetBranchId || presetItemId ? 'pending' : 'ready'
  );
  const [initialMultiStepIndex, setInitialMultiStepIndex] = useState(0);
  const [presetBranchFilterIds, setPresetBranchFilterIds] = useState<Set<string> | null>(null);
  /** Když API u pobočky nevrátí `services`, doplníme služby z profilů holičů na pobočce. */
  const [aggregatedBranchServices, setAggregatedBranchServices] = useState<{
    options: ServiceOption[];
    offerersByServiceId: Map<string, Set<string>>;
  } | null>(null);
  const [loadingAggregatedBranchServices, setLoadingAggregatedBranchServices] = useState(false);
  /** Detail pobočky ze GET /branches/:id (služby pro krok 2). */
  const [branchServicesSource, setBranchServicesSource] = useState<Branch | null>(null);
  const [loadingBranchServicesFetch, setLoadingBranchServicesFetch] = useState(false);

  /** Clear wizard fields for steps after `stepIndex` (used when user goes Back). Krok 0=pobočka,1=služba,2=holič,3=čas,4=shrnutí */
  const resetFlowAfterStep = useCallback(
    (stepIndex: number) => {
      const durationForItem = (prev: ReservationFlowData) => {
        if (!prev.itemId || !prev.branchId) return 0;
        const fromFetched =
          branchServicesSource?.id === prev.branchId ? branchServicesSource : null;
        const b = fromFetched ?? branches.find((x) => x.id === prev.branchId) ?? null;
        const svc = b ? findServiceOptionOnBranch(b, prev.itemId) : null;
        return svc?.duration ?? 0;
      };
      setData((prev) => {
        if (stepIndex < 1) {
          return {
            ...prev,
            employeeId: presetEmployeeId ? presetEmployeeId : '',
            itemId: presetItemId ? presetItemId : '',
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : 0,
          };
        }
        if (stepIndex < 2) {
          if (presetItemId) {
            return {
              ...prev,
              employeeId: presetEmployeeId ? presetEmployeeId : '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: prev.duration,
            };
          }
          return {
            ...prev,
            employeeId: presetEmployeeId ? presetEmployeeId : '',
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: prev.itemId ? durationForItem(prev) : 0,
          };
        }
        if (stepIndex < 3) {
          return {
            ...prev,
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : durationForItem(prev),
          };
        }
        if (stepIndex < 4) {
          return {
            ...prev,
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : durationForItem(prev),
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
    },
    [presetEmployeeId, presetItemId, branches, branchServicesSource]
  );

  const selectBranchId = useCallback(
    (branchId: string) => {
      let branchChanged = false;
      setData((prev) => {
        if (prev.branchId === branchId) return prev;
        branchChanged = true;
        const b = branches.find((x) => x.id === branchId);
        let nextDuration = 0;
        if (presetItemId && b) {
          const svc = findServiceOptionOnBranch(b, presetItemId);
          nextDuration = svc?.duration ?? prev.duration ?? 0;
        }
        return {
          ...prev,
          branchId,
          employeeId: presetEmployeeId ? presetEmployeeId : '',
          itemId: presetItemId ? presetItemId : '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: presetItemId ? nextDuration : 0,
        };
      });
      if (branchChanged) {
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
      }
    },
    [presetEmployeeId, presetItemId, branches]
  );

  const selectEmployee = useCallback((employeeId: string) => {
    setData((prev) => ({
      ...prev,
      employeeId,
      itemId: prev.itemId,
      date: '',
      slotStart: '',
      slotEnd: '',
      duration: prev.duration,
    }));
    setLastSelectedDateByMonth({});
  }, []);

  const selectServiceOption = useCallback(
    (service: ServiceOption) => {
      const keepEmp =
        (barberEntryMode === 'multi' || barberEntryMode === 'single') && Boolean(presetEmployeeId);
      setData((prev) => ({
        ...prev,
        itemId: service.id,
        employeeId: keepEmp ? presetEmployeeId! : '',
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: service.duration,
      }));
      setLastSelectedDateByMonth({});
    },
    [barberEntryMode, presetEmployeeId]
  );

  useEffect(() => {
    if (!apiToken) {
      setLoadingBranches(false);
      return;
    }
    setLoadingBranches(true);
    Promise.all([
      getBranches(apiToken),
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 99 }).catch(
        () => [] as Employee[]
      ),
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

  useEffect(() => {
    const hasDeepLink = Boolean(presetEmployeeId || presetBranchId || presetItemId);
    if (!hasDeepLink) {
      setBarberBootstrap('ready');
      setBarberEntryMode('none');
      setPresetBranchFilterIds(null);
      setInitialMultiStepIndex(0);
      return;
    }
    if (!apiToken) {
      setBarberBootstrap('error');
      return;
    }
    if (loadingBranches) return;

    if (presetEmployeeId && presetBranchId && presetItemId) {
      const branch = branches.find((b) => b.id === presetBranchId) ?? null;
      if (!branch) {
        setData((prev) => ({
          ...prev,
          branchId: '',
          employeeId: '',
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        }));
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
        setBarberEntryMode('none');
        setInitialMultiStepIndex(0);
        setPresetBranchFilterIds(null);
        setBarberBootstrap('ready');
        return;
      }

      const svc = findServiceOptionOnBranch(branch, presetItemId);
      const duration = svc?.duration ?? 0;
      setData((prev) => ({
        ...prev,
        branchId: presetBranchId,
        employeeId: presetEmployeeId,
        itemId: presetItemId,
        date: '',
        slotStart: '',
        slotEnd: '',
        duration,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('single');
      setInitialMultiStepIndex(3);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
      return;
    }

    if (presetEmployeeId) {
      let cancelled = false;
      setBarberBootstrap('pending');
      getEmployeeById(apiToken, presetEmployeeId)
        .then((emp) => {
          if (cancelled) return;
          const eb = getEmployeeBranchesList(emp);
          const ids = new Set(eb.map((b) => b.id).filter((id) => typeof id === 'string' && id));
          const matched = branches.filter((b) => ids.has(b.id));
          if (matched.length === 1) {
            setData((prev) => ({
              ...prev,
              branchId: matched[0].id,
              employeeId: presetEmployeeId,
              itemId: '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: 0,
            }));
            setLastSelectedDateByMonth({});
            setMonthOffset(0);
            setBarberEntryMode('single');
            setInitialMultiStepIndex(1);
            setPresetBranchFilterIds(null);
            setBarberBootstrap('ready');
          } else if (matched.length > 1) {
            setData((prev) => ({
              ...prev,
              branchId: '',
              employeeId: presetEmployeeId,
              itemId: '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: 0,
            }));
            setLastSelectedDateByMonth({});
            setMonthOffset(0);
            setBarberEntryMode('multi');
            setInitialMultiStepIndex(0);
            setPresetBranchFilterIds(ids);
            setBarberBootstrap('ready');
          } else {
            setBarberEntryMode('none');
            setBarberBootstrap('error');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBarberEntryMode('none');
            setBarberBootstrap('error');
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (presetBranchId) {
      const exists = branches.some((b) => b.id === presetBranchId);
      if (!exists) {
        // Fallback: invalid branch deep-link should not block booking flow.
        setData((prev) => ({
          ...prev,
          branchId: '',
          employeeId: '',
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        }));
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
        setBarberEntryMode('none');
        setInitialMultiStepIndex(0);
        setPresetBranchFilterIds(null);
        setBarberBootstrap('ready');
        return;
      }
      setData((prev) => ({
        ...prev,
        branchId: presetBranchId,
        employeeId: '',
        itemId: '',
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: 0,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('branch');
      setInitialMultiStepIndex(1);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
      return;
    }

    if (presetItemId) {
      // Služba z detailu itemu: držíme `itemId` a režim `service` i když služba ještě není v datech
      // žádné pobočky (API katalog vs. vnořené služby u branch) — jinak by se znovu zobrazil výběr služby.
      let duration = 0;
      for (const b of branches) {
        const svc = findServiceOptionOnBranch(b, presetItemId);
        if (svc) {
          duration = svc.duration;
          break;
        }
      }
      setData((prev) => ({
        ...prev,
        branchId: '',
        employeeId: '',
        itemId: presetItemId,
        date: '',
        slotStart: '',
        slotEnd: '',
        duration,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('service');
      setInitialMultiStepIndex(0);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
    }
  }, [presetEmployeeId, presetBranchId, presetItemId, apiToken, loadingBranches, branches]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === data.branchId) ?? null,
    [branches, data.branchId]
  );

  useEffect(() => {
    if (!apiToken || !data.branchId?.trim()) {
      setBranchServicesSource(null);
      setLoadingBranchServicesFetch(false);
      return;
    }
    let cancelled = false;
    setBranchServicesSource(null);
    setLoadingBranchServicesFetch(true);
    setAggregatedBranchServices(null);
    getBranchById(apiToken, data.branchId.trim())
      .then((b) => {
        if (!cancelled) setBranchServicesSource(b);
      })
      .catch(() => {
        if (!cancelled) {
          setBranchServicesSource(
            branchesRef.current.find((x) => x.id === data.branchId) ?? null
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBranchServicesFetch(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.branchId]);

  const branchForServiceStep = branchServicesSource ?? selectedBranch;

  const branchPickerFromBranchPayload = useMemo(
    () => buildBranchServicePickerData(branchForServiceStep),
    [branchForServiceStep]
  );

  useEffect(() => {
    if (!apiToken || !selectedBranch?.id) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    if (loadingBranchServicesFetch) {
      return;
    }
    if (branchPickerFromBranchPayload.options.length > 0) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    const emps = getEmployeesList(branchForServiceStep)
      .map((e) => mergeEmployee(e, employeesById[e.id]))
      .filter((e) => e.isActive !== false && isEmployeePubliclyBookable(e));
    if (emps.length === 0) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    let cancelled = false;
    setLoadingAggregatedBranchServices(true);
    setAggregatedBranchServices(null);
    Promise.all(
      emps.map((e) =>
        getEmployeeById(apiToken, e.id)
          .then((emp) => ({
            employeeId: e.id,
            services: getEmployeeServicesList(emp.services),
          }))
          .catch(() => ({ employeeId: e.id, services: [] as EmployeeService[] }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        const offerersByServiceId = new Map<string, Set<string>>();
        const unique = new Map<string, ServiceOption>();
        for (const { employeeId, services } of results) {
          for (const s of services) {
            if (!offerersByServiceId.has(s.id)) offerersByServiceId.set(s.id, new Set());
            offerersByServiceId.get(s.id)!.add(employeeId);
            if (!unique.has(s.id)) {
              unique.set(s.id, {
                id: s.id,
                name: s.name,
                imageUrl: s.imageUrl,
                price: s.price,
                duration: s.duration,
                category: s.category,
              });
            } else {
              const prev = unique.get(s.id)!;
              unique.set(s.id, {
                ...prev,
                price: mergeServiceMinPrice(prev.price, s.price),
              });
            }
          }
        }
        setAggregatedBranchServices({
          options: Array.from(unique.values()),
          offerersByServiceId,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingAggregatedBranchServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    apiToken,
    selectedBranch,
    branchForServiceStep,
    loadingBranchServicesFetch,
    branchPickerFromBranchPayload.options.length,
    employeesById,
  ]);

  const branchesForReservation = useMemo(() => {
    if (presetBranchFilterIds != null && presetBranchFilterIds.size > 0) {
      return branches.filter((b) => presetBranchFilterIds.has(b.id));
    }
    return branches;
  }, [branches, presetBranchFilterIds]);
  const employeesAll = useMemo(
    () =>
      getEmployeesList(branchForServiceStep)
        .map((e) => mergeEmployee(e, employeesById[e.id]))
        .filter((e) => e.isActive !== false && isEmployeePubliclyBookable(e)),
    [branchForServiceStep, employeesById]
  );
  const serviceOfferersByItemId = useMemo(() => {
    if (branchPickerFromBranchPayload.options.length > 0) {
      return branchPickerFromBranchPayload.offerersByServiceId;
    }
    return aggregatedBranchServices?.offerersByServiceId ?? new Map<string, Set<string>>();
  }, [branchPickerFromBranchPayload, aggregatedBranchServices]);

  const employees = useMemo(() => {
    if (!data.itemId) return employeesAll;
    const ids = serviceOfferersByItemId.get(data.itemId);
    if (!ids || ids.size === 0) return employeesAll;
    return employeesAll.filter((e) => ids.has(e.id));
  }, [employeesAll, data.itemId, serviceOfferersByItemId]);

  const branchStepServiceOptions = useMemo(() => {
    if (branchPickerFromBranchPayload.options.length > 0) {
      return branchPickerFromBranchPayload.options;
    }
    return aggregatedBranchServices?.options ?? [];
  }, [branchPickerFromBranchPayload, aggregatedBranchServices]);

  const serviceCategoryOtherLabel = t('serviceCategoryOther');
  const branchStepServiceCategories = useMemo(
    () => groupServicesByCategory(branchStepServiceOptions, serviceCategoryOtherLabel),
    [branchStepServiceOptions, serviceCategoryOtherLabel]
  );

  const groupedSlots = useMemo(() => {
    const slots = availability?.availability?.slots ?? [];
    const morning = slots.filter((s) => timeToMinutes(s.start) < 12 * 60);
    const afternoon = slots.filter(
      (s) => timeToMinutes(s.start) >= 12 * 60 && timeToMinutes(s.start) < 17 * 60
    );
    const evening = slots.filter((s) => timeToMinutes(s.start) >= 17 * 60);
    return { morning, afternoon, evening };
  }, [availability]);
  const monthDays = useMemo(
    () => getMonthDays(monthOffset, dateLocaleTag),
    [monthOffset, dateLocaleTag]
  );
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
      return;
    }
    getEmployeeById(apiToken, data.employeeId)
      .then((emp) => {
        setEmployeeServices(getEmployeeServicesList(emp.services));
      })
      .catch(() => setEmployeeServices([]));
  }, [apiToken, data.employeeId]);

  useEffect(() => {
    if (!data.itemId || !data.employeeId) return;
    const match = employeeServices.find((s) => s.id === data.itemId);
    if (match == null || typeof match.duration !== 'number') return;
    setData((prev) =>
      prev.duration === match.duration ? prev : { ...prev, duration: match.duration }
    );
  }, [employeeServices, data.itemId, data.employeeId]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || !data.date) {
      setAvailability(null);
      setAvailabilityError(null);
      return;
    }
    let cancelled = false;
    setAvailability(null);
    setLoadingAvailability(true);
    setAvailabilityError(null);
    // Délka slotů a omezení pobočkou/službou: employeeId + date + branchId + itemId jako při výběru.
    getBookingAvailability(apiToken, {
      employeeId: data.employeeId,
      date: data.date,
      branchId: data.branchId.trim() !== '' ? data.branchId : undefined,
      itemId: data.itemId.trim() !== '' ? data.itemId : undefined,
      noCache: true,
    })
      .then((res) => {
        if (!cancelled) setAvailability(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.employeeId, data.date, data.branchId, data.itemId]);

  useEffect(() => {
    if (!apiToken || !data.employeeId || monthDays.length === 0) {
      setAvailableDatesInMonth(new Set());
      setLoadingMonthAvailability(false);
      return;
    }
    let cancelled = false;
    setAvailableDatesInMonth(new Set());
    setLoadingMonthAvailability(true);
    Promise.all(
      monthDays.map(async (day) => {
        try {
          const res = await getBookingAvailability(apiToken, {
            employeeId: data.employeeId,
            date: day.value,
            branchId: data.branchId.trim() !== '' ? data.branchId : undefined,
            itemId: data.itemId.trim() !== '' ? data.itemId : undefined,
            noCache: true,
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
            if (
              prev.date === nextDate &&
              prev.slotStart === '' &&
              prev.slotEnd === '' &&
              prev.duration === 0
            ) {
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
            if (
              prev.date === '' &&
              prev.slotStart === '' &&
              prev.slotEnd === '' &&
              prev.duration === 0
            )
              return prev;
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
        // slotEnd může doplnit server podle délky služby
        slotEnd: data.slotEnd.trim() !== '' ? data.slotEnd : undefined,
        notes: '',
      };
      const created = await createBooking(apiToken, payload);
      const createdId =
        (typeof created.id === 'string' ? created.id : undefined) ??
        (created.booking && typeof created.booking.id === 'string'
          ? created.booking.id
          : undefined);
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

  const detailsEmployee = employeesAll.find((e) => e.id === detailsEmployeeId) ?? null;
  const detailsDescription = detailsEmployee ? employeeDescription(detailsEmployee) : '';
  const detailsMedia = detailsEmployee ? getEmployeeMedia(detailsEmployee) : [];
  const detailsBranch = branches.find((b) => b.id === detailsBranchId) ?? null;
  const detailsBranchDescription = detailsBranch ? branchDescription(detailsBranch) : '';
  const detailsBranchMedia = detailsBranch ? getBranchMedia(detailsBranch) : [];
  const detailsBranchImages = detailsBranchMedia.filter((m) => m.type !== 'video');
  const detailsBranchVideo = detailsBranchMedia.find((m) => m.type === 'video');
  const selectedEmployee = useMemo(() => {
    const fromList = employeesAll.find((e) => e.id === data.employeeId);
    if (fromList) return fromList;
    const full = data.employeeId ? employeesById[data.employeeId] : undefined;
    if (full) {
      return mergeEmployee(
        { id: full.id, name: full.name, isActive: true } as BranchEmployee,
        full
      );
    }
    return null;
  }, [employeesAll, data.employeeId, employeesById]);
  const selectedService = useMemo((): ServiceOption | null => {
    const empSvc = employeeServices.find((s) => s.id === data.itemId);
    if (empSvc) {
      return {
        id: empSvc.id,
        name: empSvc.name,
        imageUrl: empSvc.imageUrl,
        price: empSvc.price,
        duration: empSvc.duration,
        category: empSvc.category,
      };
    }
    if (!branchForServiceStep || !data.itemId) return null;
    return findServiceOptionOnBranch(branchForServiceStep, data.itemId);
  }, [employeeServices, branchForServiceStep, data.itemId]);
  const selectedEmployeeName = selectedEmployee?.name ?? '—';
  const selectedServiceName =
    selectedService?.name ??
    (presetItemName && data.itemId === presetItemId ? presetItemName : null) ??
    '—';
  const selectedDateLabel = data.date
    ? new Date(data.date).toLocaleDateString(dateLocaleTag, {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : '—';
  const summaryBranchCardImage = useMemo(
    () => getBranchCardImageSource(branchForServiceStep),
    [branchForServiceStep]
  );

  const useFlowNextResolver =
    ((barberEntryMode === 'multi' || barberEntryMode === 'single') && Boolean(presetEmployeeId)) ||
    (barberEntryMode === 'service' && Boolean(presetItemId));

  const useFlowPrevResolver =
    Boolean(presetEmployeeId) || barberEntryMode === 'branch' || barberEntryMode === 'service';

  const flowStepNextIndex = useCallback(
    (currentStepIndex: number, _stepsLength: number) => {
      if (barberEntryMode === 'service' && presetItemId && currentStepIndex === 0) return 2;
      if (
        (barberEntryMode === 'multi' || barberEntryMode === 'single') &&
        presetEmployeeId &&
        currentStepIndex === 1
      )
        return 3;
      return currentStepIndex + 1;
    },
    [barberEntryMode, presetEmployeeId, presetItemId]
  );

  const flowStepPrevIndex = useCallback(
    (currentStepIndex: number) => {
      if (presetEmployeeId) {
        if (barberEntryMode === 'single' && currentStepIndex === 3) return 1;
        if (barberEntryMode === 'single' && currentStepIndex === 1) return -1;
        if (barberEntryMode === 'multi' && currentStepIndex === 3) return 1;
        return currentStepIndex - 1;
      }
      if (barberEntryMode === 'branch' && presetBranchId) {
        if (currentStepIndex === 1) return -1;
        return currentStepIndex - 1;
      }
      if (barberEntryMode === 'service' && presetItemId) {
        if (currentStepIndex === 3) return 2;
        if (currentStepIndex === 2) return 0;
        if (currentStepIndex === 0) return -1;
        return currentStepIndex - 1;
      }
      return currentStepIndex - 1;
    },
    [presetEmployeeId, presetBranchId, presetItemId, barberEntryMode]
  );

  if (barberBootstrap === 'pending') {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (barberBootstrap === 'error' && presetEmployeeId) {
    return (
      <View className="flex-1 bg-light-primary px-global pt-2 dark:bg-dark-primary">
        <Header showBackButton />
        <View className="mt-6">
          <ThemedText className="text-base text-light-text dark:text-dark-text">
            {presetEmployeeId
              ? t('reservationFromBarberLoadError')
              : t('reservationFromDeepLinkError')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <>
      <MultiStep
        key={`res-${presetEmployeeId ?? 'e'}-${presetBranchId ?? 'b'}-${presetItemId ?? 'i'}-${barberEntryMode}-${initialMultiStepIndex}`}
        initialStepIndex={initialMultiStepIndex}
        getNextStepIndex={useFlowNextResolver ? flowStepNextIndex : undefined}
        getPrevStepIndex={useFlowPrevResolver ? flowStepPrevIndex : undefined}
        onComplete={handleCreateBooking}
        onClose={() => router.back()}
        showStepIndicator={false}
        onStepIndexChange={(idx, reason) => {
          if (reason === 'back') {
            resetFlowAfterStep(idx);
          }
        }}
        isNextDisabled={(stepIndex) => !isReservationStepValid(stepIndex, data)}>
        <Step title={t('reservationStepBranchTitle')}>
          <ScrollView className="px-6 pb-4 pt-2">
            <View className="mb-3 items-center">
              <Image
                source={require('@/assets/img/reservation-branch.png')}
                className="h-16 w-16"
                style={{ width: 64, height: 64 }}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View className="mb-5">
              <ThemedText className="text-2xl font-semibold">
                {t('reservationStepBranchTitle')}
              </ThemedText>
              <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
                {t('reservationStepBranchSubtitle')}
              </ThemedText>
              <Button
                title={t('reservationShowMap')}
                variant="outline"
                size="small"
                rounded="full"
                className="mt-2 self-center px-4"
                href="/screens/map"
              />
            </View>
            {loadingBranches ? (
              <View className="items-center py-10">
                <ActivityIndicator size="small" />
              </View>
            ) : (
              branchesForReservation.map((branch) => (
                <View key={branch.id} className="mb-2">
                  <Selectable
                    title={branch.name}
                    description={branch.address ?? ''}
                    customIcon={
                      getBranchImageUrl(branch) ? (
                        <Image
                          source={{ uri: getBranchImageUrl(branch)! }}
                          className="h-12 w-12 rounded-xl"
                          contentFit="cover"
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
                    className="absolute right-4 top-4 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
                    onPress={() => {
                      selectBranchId(branch.id);
                      setDetailsBranchId(branch.id);
                      setIsBranchDescriptionExpanded(false);
                      branchDetailsSheetRef.current?.show();
                    }}>
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      {t('reservationMore')}
                    </ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </Step>

        <Step title={t('reservationStepServiceTitle')}>
          <ScrollView className="px-6 pb-4 pt-2">
            <View className="mb-3 items-center">
              <Image
                source={require('@/assets/img/reservation-service.png')}
                className="h-16 w-16"
                style={{ width: 64, height: 64 }}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View className="mb-5">
              <ThemedText className="text-2xl font-semibold">
                {t('reservationStepServiceTitle')}
              </ThemedText>
              <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
                {t('reservationStepServiceSubtitle')}
              </ThemedText>
            </View>
            {(loadingBranchServicesFetch ||
              (loadingAggregatedBranchServices && branchStepServiceOptions.length === 0)) &&
            branchStepServiceOptions.length === 0 ? (
              <View className="items-center py-10">
                <ActivityIndicator size="small" />
                <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('commonLoading')}
                </ThemedText>
              </View>
            ) : null}
            {!loadingBranchServicesFetch && branchStepServiceCategories.length > 0
              ? branchStepServiceCategories.map((category, categoryIndex) => (
                  <Section
                    key={`res-svc-cat-${category.key}-${categoryIndex}`}
                    title={category.name}
                    titleSize="lg"
                    className="mb-4">
                    <CardScroller className="mt-1.5 pb-1" space={12}>
                      {category.services.map((service, serviceIndex) => {
                        const isSelected = data.itemId === service.id;
                        return (
                          <Pressable
                            key={`res-svc-${category.key}-${service.id}-${serviceIndex}`}
                            onPress={() => selectServiceOption(service)}
                            className="w-[160px] active:opacity-80">
                            <View
                              className="relative overflow-hidden rounded-2xl"
                              style={
                                isSelected
                                  ? { borderColor: colors.highlight, borderWidth: 2 }
                                  : undefined
                              }>
                              <Image
                                source={
                                  service.imageUrl
                                    ? { uri: service.imageUrl }
                                    : require('@/assets/img/barbers.png')
                                }
                                className="h-[140px] w-[160px]"
                                contentFit="cover"
                              />
                              <View className="absolute right-2 top-2 z-10 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary">
                                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                                  {t('reservationPriceFromPrefix')} {service.price}{' '}
                                  {t('reservationCurrencySuffix')}
                                </ThemedText>
                              </View>
                            </View>
                            <View className="w-full py-2">
                              <ThemedText className="min-w-0 text-sm font-medium" numberOfLines={2}>
                                {service.name}
                              </ThemedText>
                            </View>
                          </Pressable>
                        );
                      })}
                    </CardScroller>
                  </Section>
                ))
              : null}
            {!loadingBranchServicesFetch &&
            !loadingAggregatedBranchServices &&
            branchStepServiceOptions.length === 0 ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationNoServices')}
              </ThemedText>
            ) : null}
          </ScrollView>
        </Step>

        <Step title={t('reservationStepEmployeeTitle')}>
          <ScrollView className="px-6 pb-4 pt-2">
            <View className="mb-3 items-center">
              <Image
                source={require('@/assets/img/reservation-specialist.png')}
                className="h-16 w-16"
                style={{ width: 64, height: 64 }}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View className="mb-5">
              <ThemedText className="text-2xl font-semibold">
                {t('reservationStepEmployeeTitle')}
              </ThemedText>
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
                    className="absolute right-4 top-4 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
                    onPress={() => {
                      selectEmployee(emp.id);
                      setDetailsEmployeeId(emp.id);
                      detailsSheetRef.current?.show();
                    }}>
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      {t('reservationMore')}
                    </ThemedText>
                  </Pressable>
                ) : null}
                {getEmployeeAverageRating(emp) != null ? (
                  <View className="ml-16 mt-1 flex-row items-center gap-2">
                    <ShowRating
                      rating={getEmployeeAverageRating(emp)!}
                      size="sm"
                      displayMode="stars"
                    />
                    <View className="rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary">
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

        <Step title={t('reservationStepDatetimeTitle')}>
          <ScrollView className="px-6 pb-4 pt-2">
            <View className="mb-3 items-center">
              <Image
                source={require('@/assets/img/reservation-time.png')}
                className="h-16 w-16"
                style={{ width: 64, height: 64 }}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View className="mb-5">
              <ThemedText className="text-2xl font-semibold">
                {t('reservationStepDatetimeTitle')}
              </ThemedText>
              <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
                {t('reservationStepDatetimeSubtitle')}
              </ThemedText>
            </View>
            <View className="mb-4 flex-row gap-2">
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
                className={`rounded-full p-2 ${monthOffset === 0 ? 'opacity-40' : 'opacity-100'}`}>
                <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
              </Pressable>
              <ThemedText className="text-base font-semibold">{monthLabel}</ThemedText>
              <Pressable
                onPress={() => setMonthOffset((prev) => prev + 1)}
                className="rounded-full p-2">
                <Icon name="ChevronRight" size={24} className="translate-x-px" />
              </Pressable>
            </View>
            {loadingMonthAvailability ? (
              <View className="items-center py-4">
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
              <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationNoSlotsMonth')}
              </ThemedText>
            ) : null}
            <View className="mb-2 mt-6">
              <ThemedText className="text-lg font-semibold">
                {t('reservationAvailableTimes')}
              </ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationAvailableTimesSubtitle')}
              </ThemedText>
            </View>
            {loadingAvailability ? (
              <View className="items-center py-10">
                <ActivityIndicator size="small" />
              </View>
            ) : availabilityError ? (
              <ThemedText className="text-red-500">{availabilityError}</ThemedText>
            ) : (
              <>
                {groupedSlots.morning.length > 0 ? (
                  <Section title={t('reservationMorning')} titleSize="md" className="mb-2">
                    <View className="mt-1 flex-row flex-wrap gap-2">
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
                    <View className="mt-1 flex-row flex-wrap gap-2">
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
                    <View className="mt-1 flex-row flex-wrap gap-2">
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
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <ThemedText className="text-2xl font-bold">{t('reservationSummaryTitle')}</ThemedText>
            <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationSummarySubtitle')}
            </ThemedText>


            <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

            <Section title={t('reservationSummaryBranch')} titleSize="lg" className="pb-1 pt-3">
              <View className="mt-2 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
                <Image
                  source={
                    typeof summaryBranchCardImage === 'number'
                      ? summaryBranchCardImage
                      : { uri: summaryBranchCardImage }
                  }
                  className="h-40 w-full"
                  contentFit="cover"
                />
                <View className="p-3">
                  <ThemedText className="text-base font-semibold">
                    {branchForServiceStep?.name ?? '—'}
                  </ThemedText>
                  {branchForServiceStep?.address ? (
                    <View className="mt-1.5 flex-row items-start">
                      <Icon
                        name="MapPin"
                        size={14}
                        className="mr-1.5 mt-0.5 text-light-subtext dark:text-dark-subtext"
                      />
                      <ThemedText className="flex-1 text-sm text-light-subtext dark:text-dark-subtext">
                        {branchForServiceStep.address}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </Section>

            <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

            <Section
              title={t('reservationSummaryWithSpecialist')}
              titleSize="lg"
              className="pb-1 pt-3">
              <View className="mt-2 flex-row items-center">
                {selectedEmployee ? (
                  <Avatar
                    size="md"
                    src={selectedEmployee.avatarUrl ?? undefined}
                    name={selectedEmployee.name}
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      —
                    </ThemedText>
                  </View>
                )}
                <View className="ml-3 min-w-0 flex-1">
                  <ThemedText className="text-base font-semibold" numberOfLines={1}>
                    {selectedEmployeeName}
                  </ThemedText>
                  {selectedServiceName !== '—' ? (
                    <ThemedText
                      className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext"
                      numberOfLines={2}>
                      {selectedServiceName}
                      {selectedService
                        ? ` · ${t('reservationPriceFromPrefix')} ${selectedService.price} ${t('reservationCurrencySuffix')}`
                        : ''}
                    </ThemedText>
                  ) : (
                    <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                      —
                    </ThemedText>
                  )}
                </View>
              </View>
            </Section>

            <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

            <Section
              title={t('reservationSummaryAppointment')}
              titleSize="lg"
              className="pb-1 pt-3">
              <ThemedText className="mt-2 text-base font-semibold">{selectedDateLabel}</ThemedText>
              <View className="mt-2 flex-row items-center justify-between rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
                <View>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {t('reservationSummaryFrom')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold">
                    {data.slotStart || '—'}
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {t('reservationSummaryTo')}
                  </ThemedText>
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
              <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">
                {createBookingError}
              </ThemedText>
            ) : null}
          </ScrollView>
        </Step>
      </MultiStep>
      <ActionSheetThemed ref={detailsSheetRef} gestureEnabled>
        <ScrollView
          className="max-h-[75vh]"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="mb-2 mt-2 text-left text-lg font-bold">
            {detailsEmployee?.name ?? t('sheetSpecialistFallback')}
          </ThemedText>
          <ThemedText className="mb-5 text-sm text-light-subtext dark:text-dark-subtext">
            {detailsDescription || t('sheetNoBio')}
          </ThemedText>
          {detailsMedia.length > 0 ? (
            <View className="mb-5">
              <ThemedText className="mb-2 text-sm font-semibold">{t('sheetPortfolio')}</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {detailsMedia.map((m, index) => (
                  <View
                    key={`${m.url}-${index}`}
                    className="h-24 w-24 overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
                    {m.type === 'video' ? (
                      <View className="flex-1 items-center justify-center">
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                          {t('sheetVideoLabel')}
                        </ThemedText>
                      </View>
                    ) : (
                      <Image source={{ uri: m.url }} className="h-full w-full" contentFit="cover" />
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
        <ScrollView
          className="max-h-[75vh]"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText className="mb-2 mt-2 text-left text-lg font-bold">
            {detailsBranch?.name ?? t('sheetBranchFallback')}
          </ThemedText>
          <ThemedText
            numberOfLines={isBranchDescriptionExpanded ? undefined : 3}
            className="mb-2 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {detailsBranchDescription || t('sheetBranchNoIntro')}
          </ThemedText>
          {detailsBranchDescription ? (
            <Pressable
              className="mb-4 self-start rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
              onPress={() => setIsBranchDescriptionExpanded((prev) => !prev)}>
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {isBranchDescriptionExpanded
                  ? t('sheetHideDescription')
                  : t('sheetShowFullDescription')}
              </ThemedText>
            </Pressable>
          ) : (
            <View className="mb-2" />
          )}
          {detailsBranchVideo ? (
            <View className="mb-4 overflow-hidden rounded-xl bg-black">
              <ThemedText className="text-sm font-semibold">{t('sheetHowToBranch')}</ThemedText>
              <VideoPlayer
                uri={detailsBranchVideo.url}
                style={{ width: '100%', height: 220 }}
                contentFit="cover"
                nativeControls
                shouldPlay
                isLooping
                isMuted
              />
            </View>
          ) : null}
          {detailsBranchImages.length > 0 ? (
            <View className="mb-5">
              <ThemedText className="mb-2 text-sm font-semibold">
                {t('sheetBranchInterior')}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {detailsBranchImages.map((m, index) => (
                  <View
                    key={`${m.url}-${index}`}
                    className="h-24 w-24 overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
                    <Image source={{ uri: m.url }} className="h-full w-full" contentFit="cover" />
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
