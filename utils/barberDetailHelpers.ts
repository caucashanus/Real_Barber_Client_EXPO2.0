import type {
  EmployeeDetail,
  EmployeeBranch,
  EmployeeService,
  EmployeeMediaItem,
} from '@/api/employees';
import type { EntityReviewItem, getEntityReviews } from '@/api/reviews';

export type TopSlide = { type: 'image' | 'video'; uri: string };

export type CategoryGroup = {
  categoryId: string;
  categoryName: string;
  services: EmployeeService[];
};

export function getMediaList(employee: EmployeeDetail): EmployeeMediaItem[] {
  const m = employee.media;
  if (!m) return [];
  const list = Array.isArray(m) ? [...m] : Object.values(m);
  const withUrl = list.filter((item) => item?.url);
  withUrl.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withUrl;
}

export function employeeTopSlides(employee: EmployeeDetail): TopSlide[] {
  const out: TopSlide[] = [];
  if (employee.avatarUrl) out.push({ type: 'image', uri: employee.avatarUrl });
  const mediaList = getMediaList(employee);
  mediaList.forEach((m) => out.push({ type: m.type === 'video' ? 'video' : 'image', uri: m.url }));
  if (out.length === 0) out.push({ type: 'image', uri: '' });
  return out;
}

export function getBranchesList(employee: EmployeeDetail): EmployeeBranch[] {
  const b = employee.branches;
  if (!b) return [];
  if (Array.isArray(b)) return b;
  return Object.values(b);
}

export function getServicesList(employee: EmployeeDetail): EmployeeService[] {
  const s = employee.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

export function groupServicesByCategory(services: EmployeeService[]): CategoryGroup[] {
  const byId = new Map<string, CategoryGroup>();
  for (const svc of services) {
    const id = svc.category?.id ?? 'unknown';
    const name = svc.category?.name ?? '—';
    if (!byId.has(id)) byId.set(id, { categoryId: id, categoryName: name, services: [] });
    byId.get(id)!.services.push(svc);
  }
  return Array.from(byId.values());
}

export function buildBarberReviewParams(employee: EmployeeDetail): string {
  const employeeImageUrl = employee.avatarUrl ?? '';
  return `entityType=employee&entityId=${encodeURIComponent(employee.id)}&entityName=${encodeURIComponent(employee.name)}${employeeImageUrl ? `&entityImage=${encodeURIComponent(employeeImageUrl)}` : ''}`;
}

export function computeReviewStats(reviews: EntityReviewItem[]) {
  const countByRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating) || 0));
    countByRating[rating] = (countByRating[rating] ?? 0) + 1;
    sum += r.rating;
  }
  const total = reviews.length;
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { countByRating, average, total };
}

export function buildOwnReviewIds(
  data: Awaited<ReturnType<typeof getEntityReviews>>,
  clientId?: string | number | null
): Set<string> {
  const ids = new Set<string>();
  if (data.clientReview?.id) ids.add(data.clientReview.id);
  data.reviews.forEach((r) => {
    if (r.client?.id != null && clientId != null && String(r.client.id) === String(clientId)) {
      ids.add(r.id);
    }
  });
  return ids;
}
