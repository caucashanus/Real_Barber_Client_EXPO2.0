import type { Branch, BranchService } from '@/api/branches';

export function getBranchServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

export function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = (Array.isArray(media) ? [...media] : Object.values(media ?? {})) as {
    url?: string;
    order?: number;
    type?: string;
  }[];
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

/** Only image URLs from media (excludes type === 'video'). */
export function getMediaImageUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = (Array.isArray(media) ? [...media] : Object.values(media ?? {})) as {
    url?: string;
    order?: number;
    type?: string;
  }[];
  const images = list.filter(
    (m): m is { url: string; order?: number; type?: string } =>
      !!m?.url && (m as { type?: string }).type !== 'video'
  );
  images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return images.map((m) => m.url);
}

export function branchImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaUrls = getMediaUrlsSorted(branch.media);
  mediaUrls.forEach((url) => out.push(url));
  if (branch.imageUrl) out.push(branch.imageUrl);
  const servicesList = getBranchServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}

/** Images for carousel only: media images (no video), no branch.imageUrl. */
export function branchCarouselImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaImageUrls = getMediaImageUrlsSorted(branch.media);
  mediaImageUrls.forEach((url) => out.push(url));
  const servicesList = getBranchServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}
