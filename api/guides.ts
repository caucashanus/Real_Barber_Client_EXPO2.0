/**
 * Návody — public CRM articles (category=guides) + bundled fallback.
 * @see docs/app-navody-crm-offboarding.md
 */
import { CrmHttpError, fetchCrm } from './http';

import { resolveGuidesSource, type GuidesSource } from '@/constants/guidesSource';
import type { GuideLocale } from '@/utils/guides/guideLocale';
import {
  guideMatchesIdOrSlug,
  mapArticlePublicToGuide,
  mapBundledGuideToGuide,
  sortGuidesByNewest,
  type ArticlePublic,
  type BundledGuideArticle,
  type GuideArticle,
} from '@/utils/guides/guideArticleMap';

export type { GuideArticle };
export type ClientGuide = GuideArticle;

export type GuideMedia = NonNullable<ArticlePublic['media']>[number];
export type GuideMediaFile = GuideMedia['mediaFile'];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BUNDLED_GUIDES = require('../docs/crm-guides-articles-export.json') as BundledGuideArticle[];

let guidesCache: GuideArticle[] = [];
let guidesCacheLocale: GuideLocale | null = null;

export function setGuidesCache(guides: GuideArticle[], locale?: GuideLocale): void {
  guidesCache = guides;
  if (locale) guidesCacheLocale = locale;
}

export function getCachedGuide(idOrSlug: string): GuideArticle | null {
  const key = idOrSlug.trim();
  if (!key) return null;
  return guidesCache.find((g) => guideMatchesIdOrSlug(g, key)) ?? null;
}

export function getCachedGuidesList(): GuideArticle[] {
  return guidesCache;
}

function loadBundledGuides(locale: GuideLocale): GuideArticle[] {
  const active = BUNDLED_GUIDES.filter((g) => g.category === 'guides' && g.isActive !== false);
  return sortGuidesByNewest(active.map((raw) => mapBundledGuideToGuide(raw, locale)));
}

async function fetchPublicGuidesList(locale: GuideLocale): Promise<GuideArticle[]> {
  const data = await fetchCrm<{ locale: string; articles: ArticlePublic[] }>(
    `/api/public/articles?locale=${encodeURIComponent(locale)}&category=guides`,
    { checkAuth: false, headers: { Accept: 'application/json' } }
  );
  const articles = (data.articles ?? []).filter((a) => a.category === 'guides');
  return sortGuidesByNewest(articles.map(mapArticlePublicToGuide));
}

async function fetchPublicGuideDetail(idOrSlug: string, locale: GuideLocale): Promise<GuideArticle> {
  const encoded = encodeURIComponent(idOrSlug.trim());
  const article = await fetchCrm<ArticlePublic>(
    `/api/public/articles/${encoded}?locale=${encodeURIComponent(locale)}&category=guides`,
    { checkAuth: false, headers: { Accept: 'application/json' } }
  );
  if (article.category !== 'guides') {
    throw new CrmHttpError('Guide not found', 404);
  }
  return mapArticlePublicToGuide(article);
}

/** @deprecated GET /api/client/guides — jen fallback zdroj `crm_client`. */
type LegacyClientGuideMedia = GuideMedia & { guideId?: string; articleId?: string; mediaFileId?: string };

type LegacyClientGuide = {
  id: string;
  title: string;
  content: string;
  targetStaff: boolean;
  targetCustomer: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  media: LegacyClientGuideMedia[];
};

async function fetchLegacyClientGuides(): Promise<GuideArticle[]> {
  const guides = await fetchCrm<LegacyClientGuide[]>('/api/client/guides', { checkAuth: false });
  return sortGuidesByNewest(
    guides
      .filter((g) => g.isActive && g.targetCustomer)
      .map((g) => ({
        id: g.id,
        category: 'guides',
        title: g.title,
        content: g.content,
        order: g.order,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        media: g.media ?? [],
      }))
  );
}

async function loadGuidesFromSource(source: GuidesSource, locale: GuideLocale): Promise<GuideArticle[]> {
  switch (source) {
    case 'bundled':
      return loadBundledGuides(locale);
    case 'crm_client':
      return fetchLegacyClientGuides();
    case 'crm_public':
    default:
      return fetchPublicGuidesList(locale);
  }
}

/** Seznam návodů (rubrika guides) — locale určuje title/content z API. */
export async function getClientGuides(locale: GuideLocale = 'cs'): Promise<GuideArticle[]> {
  const primary = resolveGuidesSource();
  const fallbacks: GuidesSource[] =
    primary === 'crm_public'
      ? ['bundled', 'crm_client']
      : primary === 'crm_client'
        ? ['crm_public', 'bundled']
        : ['crm_public'];

  const tried = new Set<GuidesSource>();
  const order = [primary, ...fallbacks.filter((s) => s !== primary)];

  let lastError: unknown;
  for (const source of order) {
    if (tried.has(source)) continue;
    tried.add(source);
    try {
      const guides = await loadGuidesFromSource(source, locale);
      setGuidesCache(guides, locale);
      return guides;
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError instanceof CrmHttpError) {
    throw new Error(`Failed to fetch guides: ${lastError.status}`);
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to fetch guides');
}

/** Detail podle UUID nebo slug (public API); fallback list + bundled. */
export async function getGuideById(idOrSlug: string, locale: GuideLocale = 'cs'): Promise<GuideArticle | null> {
  const key = idOrSlug.trim();
  if (!key) return null;

  const cached = getCachedGuide(key);
  if (cached && guidesCacheLocale === locale) {
    return cached;
  }

  try {
    const detail = await fetchPublicGuideDetail(key, locale);
    const nextCache = [...guidesCache.filter((g) => g.id !== detail.id), detail];
    setGuidesCache(sortGuidesByNewest(nextCache), locale);
    return detail;
  } catch {
    // continue to list fallback
  }

  const list =
    guidesCache.length > 0 && guidesCacheLocale === locale
      ? guidesCache
      : await getClientGuides(locale);
  return list.find((g) => guideMatchesIdOrSlug(g, key)) ?? null;
}
