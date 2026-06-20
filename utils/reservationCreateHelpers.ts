import type { EmployeesNearestNextSlot } from '@/api/availability';
import type { Branch, BranchEmployee } from '@/api/branches';
import type { Employee, EmployeeBranch, EmployeeDetail, EmployeeService } from '@/api/employees';
import type { TranslationKey } from '@/locales';

export interface ReservationFlowData {
  branchId: string;
  employeeId: string;
  itemId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
}

export type ServiceOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
  category?: { id?: string; name?: string } | null;
};

export type AvailabilitySlot = {
  start: string;
  end: string;
  duration: number;
  branchId?: string;
};

export function getEmployeesList(branch: Branch | null): BranchEmployee[] {
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
  return out;
}

function strVal(v: unknown): string {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : '';
}

function numVal(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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
    strVal(r.id) ||
    strVal(r.itemId) ||
    (nestedItem ? strVal(nestedItem.id) : '') ||
    (nestedService ? strVal(nestedService.id) : '');
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

export function getEmployeeBranchesList(
  employee: Pick<EmployeeDetail, 'branches'>
): EmployeeBranch[] {
  const b = employee.branches;
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Object.values(b);
}

export function getEmployeeServicesList(
  services: EmployeeService[] | Record<string, EmployeeService> | undefined
): EmployeeService[] {
  if (!services) return [];
  if (Array.isArray(services)) return services;
  return Object.values(services);
}

export function getBranchImageUrl(branch: Branch): string | null {
  const media = branch.media;
  if (Array.isArray(media) && media.length > 0) {
    const sorted = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstMediaUrl = sorted.find((m) => !!m?.url)?.url;
    if (firstMediaUrl) return firstMediaUrl;
  }
  return branch.imageUrl ?? null;
}

export function branchDescription(branch: Branch): string {
  const raw = (branch as { description?: unknown }).description;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim();
}

export function getBranchMedia(
  branch: Branch
): { url: string; type?: 'image' | 'video'; order?: number }[] {
  const raw = branch.media;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  const out: { url: string; type?: 'image' | 'video'; order?: number }[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const url = (item as { url?: unknown }).url;
    const type = (item as { type?: unknown }).type;
    const order = (item as { order?: unknown }).order;
    if (typeof url !== 'string' || url.trim() === '') continue;
    const row: { url: string; type?: 'image' | 'video'; order?: number } = {
      url,
      type: type === 'video' ? 'video' : 'image',
    };
    if (typeof order === 'number') row.order = order;
    out.push(row);
  }
  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getBranchCardImageSource(branch: Branch | null): string | number {
  if (!branch) return require('@/assets/img/barbers.png');
  const media = getBranchMedia(branch);
  const firstStill = media.find((m) => m.type !== 'video') ?? media[0];
  if (firstStill?.url) return firstStill.url;
  if (branch.imageUrl) return branch.imageUrl;
  const pick = buildBranchServicePickerData(branch).options.find((s) => s.imageUrl);
  if (pick?.imageUrl) return pick.imageUrl;
  return require('@/assets/img/barbers.png');
}

export function employeeDescription(employee: BranchEmployee): string {
  const raw =
    (employee as { description?: unknown }).description ?? (employee as { bio?: unknown }).bio;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim();
}

export function getEmployeeAverageRating(employee: BranchEmployee): number | null {
  const inline = (employee as { averageRating?: unknown }).averageRating;
  if (typeof inline === 'number' && Number.isFinite(inline)) {
    return Math.round(inline * 10) / 10;
  }
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

export function mergeEmployee(base: BranchEmployee, full?: Employee): BranchEmployee {
  if (!full) return base;
  return {
    ...base,
    ...full,
    description:
      (full as { description?: string | null }).description ??
      (base as { description?: string | null }).description,
    reviews: (full as { reviews?: unknown }).reviews ?? (base as { reviews?: unknown }).reviews,
    averageRating:
      (full as { averageRating?: number }).averageRating ??
      (base as { averageRating?: number }).averageRating,
  } as BranchEmployee;
}

export function getEmployeeMedia(
  employee: BranchEmployee
): { url: string; type?: 'image' | 'video' }[] {
  const raw = (employee as { media?: unknown }).media;
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'object'
      ? Object.values(raw as Record<string, unknown>)
      : [];
  const out: { url: string; type?: 'image' | 'video' }[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const url = (item as { url?: unknown }).url;
    const type = (item as { type?: unknown }).type;
    if (typeof url !== 'string' || url.trim() === '') continue;
    out.push({
      url,
      type: type === 'video' ? 'video' : 'image',
    });
  }
  return out;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthDays(
  offset: number,
  dateLocale: string
): { value: string; label: string }[] {
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

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function getMonthOffsetFromToday(target: Date): number {
  const now = new Date();
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

/** Kalendář v rezervaci: skok na měsíc nejbližšího volného slotu (ISO YYYY-MM-DD). */
export function calendarTargetFromNearestSlot(isoDate: string): {
  monthOffset: number;
  monthKey: string;
  dateIso: string;
} | null {
  const parts = isoDate.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  const target = new Date(year, month - 1, day);
  if (Number.isNaN(target.getTime())) return null;
  return {
    monthOffset: Math.max(0, getMonthOffsetFromToday(target)),
    monthKey: getMonthKeyFromDate(target),
    dateIso: isoDate,
  };
}

export function getMonthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

export function isReservationStepValid(stepIndex: number, d: ReservationFlowData): boolean {
  if (stepIndex === 0) return Boolean(d.branchId);
  if (stepIndex === 1) return Boolean(d.itemId);
  if (stepIndex === 2) return Boolean(d.employeeId);
  if (stepIndex === 3) return Boolean(d.date && d.slotStart);
  return true;
}

export function serviceOptionFromEmployeeService(s: EmployeeService): ServiceOption {
  return {
    id: s.id,
    name: s.name,
    imageUrl: s.imageUrl,
    price: s.price,
    duration: s.duration,
    category: s.category,
  };
}

export function mergeAggregatedEmployeeServices(
  results: { employeeId: string; services: EmployeeService[] }[]
): {
  options: ServiceOption[];
  offerersByServiceId: Map<string, Set<string>>;
} {
  const offerersByServiceId = new Map<string, Set<string>>();
  const unique = new Map<string, ServiceOption>();

  for (const { employeeId, services } of results) {
    for (const s of services) {
      if (!offerersByServiceId.has(s.id)) offerersByServiceId.set(s.id, new Set());
      offerersByServiceId.get(s.id)!.add(employeeId);
      if (!unique.has(s.id)) {
        unique.set(s.id, serviceOptionFromEmployeeService(s));
      } else {
        const prev = unique.get(s.id)!;
        unique.set(s.id, {
          ...prev,
          price: mergeServiceMinPrice(prev.price, s.price),
        });
      }
    }
  }
  return {
    options: Array.from(unique.values()),
    offerersByServiceId,
  };
}

export function buildBranchServicePickerData(branch: Branch | null): {
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

export function findServiceOptionOnBranch(
  branch: Branch | null,
  itemId: string
): ServiceOption | null {
  if (!branch || !itemId) return null;
  return buildBranchServicePickerData(branch).options.find((s) => s.id === itemId) ?? null;
}

/** Rozdíl kalendářních dnů: slotDate − dnes (0 = dnes, 1 = zítra, …). */
function calendarDayDiffFromToday(isoDate: string): number {
  const parts = isoDate.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return Number.NaN;
  const [yy, mm, dd] = parts;
  const slotDay = new Date(yy, mm - 1, dd);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((slotDay.getTime() - todayStart.getTime()) / 86400000);
}

/** Zarovnání HH:MM nahoru na mřížku 15 min (jen zobrazení badge nejbližšího termínu). Při přetečení dne → 23:45. */
function roundNearestSlotDisplayTime(slotStart: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slotStart.trim());
  if (!m) return slotStart;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return slotStart;
  const total = Math.ceil((h * 60 + min) / 15) * 15;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  if (nh >= 24) return '23:45';
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

type EmployeesNearestRow = { price: number; nextSlot: EmployeesNearestNextSlot | null };

/** Řazení: nejdříve podle data/času slotu, pak načítání, pak bez slotu (localeCompare). */
export function employeeNearestSortKey(
  employeeId: string,
  nearestMap: Map<string, EmployeesNearestRow> | null,
  loadingNearest: boolean
): string {
  if (loadingNearest && nearestMap === null) return `1|${employeeId}`;
  const row = nearestMap?.get(employeeId);
  if (row?.nextSlot) {
    const t = roundNearestSlotDisplayTime(row.nextSlot.slotStart);
    return `0|${row.nextSlot.date} ${t}|${employeeId}`;
  }
  return `2|${employeeId}`;
}

export function formatEmployeeNearestSlotLabel(
  slot: EmployeesNearestNextSlot,
  dateLocaleTag: string,
  t: (key: TranslationKey) => string
): string {
  const diff = calendarDayDiffFromToday(slot.date);
  const time = roundNearestSlotDisplayTime(slot.slotStart);
  if (!Number.isFinite(diff)) {
    const d = new Date(`${slot.date}T12:00:00`);
    const dateStr = d.toLocaleDateString(dateLocaleTag, {
      day: 'numeric',
      month: 'numeric',
    });
    return `${dateStr} ${t('reservationNearestSlotAt')} ${time}`;
  }
  if (diff < 0) {
    const parts = slot.date.split('-').map((x) => parseInt(x, 10));
    const dayNum = parts[2];
    const monthNum = parts[1];
    if (dateLocaleTag.startsWith('cs')) {
      return `${dayNum}. ${monthNum}. ${t('reservationNearestSlotAt')} ${time}`;
    }
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dateStr = d.toLocaleDateString(dateLocaleTag, { day: 'numeric', month: 'short' });
    return `${dateStr} ${t('reservationNearestSlotAt')} ${time}`;
  }
  if (diff === 0) return `${t('reservationToday')} ${time}`;
  if (diff === 1) return `${t('reservationTomorrow')} ${time}`;
  if (diff === 2) return `${t('reservationDayAfterTomorrow')} ${time}`;
  if (diff >= 3 && diff <= 6) {
    const parts = slot.date.split('-').map((x) => parseInt(x, 10));
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    let weekday = d.toLocaleDateString(dateLocaleTag, { weekday: 'long' });
    if (weekday.length > 0) {
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    }
    return `${weekday} ${time}`;
  }
  const parts = slot.date.split('-').map((x) => parseInt(x, 10));
  const dayNum = parts[2];
  const monthNum = parts[1];
  if (dateLocaleTag.startsWith('cs')) {
    return `${dayNum}. ${monthNum}. ${t('reservationNearestSlotAt')} ${time}`;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dateStr = d.toLocaleDateString(dateLocaleTag, { day: 'numeric', month: 'short' });
  return `${dateStr} ${t('reservationNearestSlotAt')} ${time}`;
}

type ServiceCategoryGroup = { key: string; name: string; services: ServiceOption[] };

/** Pořadí sekcí v kroku výběru služby (názvy jako z CRM). */
const RESERVATION_SERVICE_CATEGORY_ORDER = ['Služby', 'Účesy', 'Balíčky'] as const;

/** Kategorie z API, které v rezervaci nezobrazujeme (porovnání podle názvu, bez rozlišení velikosti písmen). */
const RESERVATION_SERVICE_CATEGORY_HIDDEN = new Set(['barvení', 'služby domů']);

function normalizedServiceCategoryName(cat: ServiceOption['category']): string {
  if (!cat) return '';
  return (cat.name?.trim() || cat.id?.trim() || '').toLowerCase();
}

function isReservationServiceCategoryHidden(service: ServiceOption): boolean {
  const n = normalizedServiceCategoryName(service.category);
  return n !== '' && RESERVATION_SERVICE_CATEGORY_HIDDEN.has(n);
}

function filterReservationVisibleServices(services: ServiceOption[]): ServiceOption[] {
  return services.filter((s) => !isReservationServiceCategoryHidden(s));
}

function sortReservationServiceCategoryGroups(
  groups: ServiceCategoryGroup[],
  otherLabel: string
): ServiceCategoryGroup[] {
  const otherNorm = otherLabel.trim().toLowerCase();
  const orderLen = RESERVATION_SERVICE_CATEGORY_ORDER.length;
  const decorated = groups.map((g, index) => {
    const nameNorm = g.name.trim().toLowerCase();
    let rank: number;
    if (nameNorm === otherNorm) {
      rank = 10000;
    } else {
      const fixed = RESERVATION_SERVICE_CATEGORY_ORDER.findIndex(
        (label) => label.toLowerCase() === nameNorm
      );
      rank = fixed >= 0 ? fixed : orderLen;
    }
    return { g, index, rank };
  });
  decorated.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return decorated.map((d) => d.g);
}

export function buildReservationServiceStepCategories(
  services: ServiceOption[],
  otherLabel: string
): ServiceCategoryGroup[] {
  const visible = filterReservationVisibleServices(services);
  const grouped = groupServicesByCategory(visible, otherLabel);
  return sortReservationServiceCategoryGroups(grouped, otherLabel);
}

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

export type BarberEntryMode = 'none' | 'single' | 'multi' | 'branch' | 'service';

export function trimParam(v: string | undefined): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t !== '' ? t : undefined;
}
