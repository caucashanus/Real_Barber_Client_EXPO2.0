import type { Branch } from '@/api/branches';

export function getBranchDirectionsVideoUrl(
  branch: Branch,
  staticUrl?: string | null
): string | null {
  if (staticUrl?.trim()) return staticUrl.trim();

  const media = branch.media;
  if (!media) return null;

  const list = (Array.isArray(media) ? [...media] : Object.values(media ?? {})) as {
    url?: string;
    order?: number;
    type?: string;
  }[];

  const videos = list.filter(
    (item): item is { url: string; order?: number; type?: string } =>
      !!item?.url && item.type === 'video'
  );

  if (videos.length === 0) return null;

  videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return videos[0]?.url ?? null;
}

export function buildVimeoEmbedUrl(vimeoId: string): string {
  return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
}
