import type { GuideLocale } from '@/utils/guides/guideLocale';

/** CRM public API + bundled export (ArticlePublic). */
export type ArticlePublicMediaFile = {
  id: string;
  filename: string;
  url: string;
  fileType: string;
  mimeType: string;
  fileSize?: number;
  title: string | null;
  alt: string | null;
};

export type ArticlePublicMedia = {
  id: string;
  order: number;
  caption: string | null;
  section: string | null;
  duration: number | null;
  thumbnailUrl: string | null;
  mediaFile: ArticlePublicMediaFile;
};

export type ArticlePublic = {
  id: string;
  category: string;
  categoryLabel?: string;
  title: string;
  content: string;
  webUrl?: string;
  webUrlEn?: string;
  webUrlUk?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
  media?: ArticlePublicMedia[];
};

/** Bundled `docs/crm-guides-articles-export.json` — všechny jazyky v jednom objektu. */
export type BundledGuideArticle = ArticlePublic & {
  titleEn?: string;
  titleUk?: string;
  contentEn?: string;
  contentUk?: string;
  heroImageAltEn?: string | null;
  heroImageAltUk?: string | null;
  targetStaff?: boolean;
  targetCustomer?: boolean;
  isActive?: boolean;
};

export type GuideArticle = {
  id: string;
  category: string;
  categoryLabel?: string;
  title: string;
  content: string;
  webUrl?: string;
  webUrlEn?: string;
  webUrlUk?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  media: ArticlePublicMedia[];
};

export function getLocalizedGuideWebUrl(article: Pick<GuideArticle, 'webUrl' | 'webUrlEn' | 'webUrlUk'>, locale: GuideLocale): string | null {
  if (locale === 'en' && article.webUrlEn?.trim()) return article.webUrlEn.trim();
  if (locale === 'uk' && article.webUrlUk?.trim()) return article.webUrlUk.trim();
  return article.webUrl?.trim() || article.webUrlEn?.trim() || article.webUrlUk?.trim() || null;
}

function pickLocalizedBundledFields(raw: BundledGuideArticle, locale: GuideLocale): Pick<GuideArticle, 'title' | 'content' | 'heroImageAlt'> {
  if (locale === 'en') {
    return {
      title: raw.titleEn?.trim() || raw.title,
      content: raw.contentEn?.trim() || raw.content,
      heroImageAlt: raw.heroImageAltEn ?? raw.heroImageAlt ?? null,
    };
  }
  if (locale === 'uk') {
    return {
      title: raw.titleUk?.trim() || raw.title,
      content: raw.contentUk?.trim() || raw.content,
      heroImageAlt: raw.heroImageAltUk ?? raw.heroImageAlt ?? null,
    };
  }
  return {
    title: raw.title,
    content: raw.content,
    heroImageAlt: raw.heroImageAlt ?? null,
  };
}

export function mapArticlePublicToGuide(article: ArticlePublic): GuideArticle {
  return {
    id: article.id,
    category: article.category,
    categoryLabel: article.categoryLabel,
    title: article.title,
    content: article.content,
    webUrl: article.webUrl,
    webUrlEn: article.webUrlEn,
    webUrlUk: article.webUrlUk,
    heroImageUrl: article.heroImageUrl ?? null,
    heroImageAlt: article.heroImageAlt ?? null,
    order: article.order ?? 0,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    media: article.media ?? [],
  };
}

export function mapBundledGuideToGuide(raw: BundledGuideArticle, locale: GuideLocale): GuideArticle {
  const localized = pickLocalizedBundledFields(raw, locale);
  return {
    id: raw.id,
    category: raw.category,
    title: localized.title,
    content: localized.content,
    webUrl: raw.webUrl,
    webUrlEn: raw.webUrlEn,
    webUrlUk: raw.webUrlUk,
    heroImageUrl: raw.heroImageUrl ?? null,
    heroImageAlt: localized.heroImageAlt,
    order: raw.order ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    media: raw.media ?? [],
  };
}

/** Web listing: nejnovější nahoře (createdAt DESC). */
export function sortGuidesByNewest(guides: GuideArticle[]): GuideArticle[] {
  return [...guides].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function slugFromGuideWebUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const path = new URL(url.trim()).pathname.replace(/\/$/, '');
    const segment = path.split('/').filter(Boolean).pop();
    return segment ? segment.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function guideMatchesIdOrSlug(guide: GuideArticle, idOrSlug: string): boolean {
  const key = idOrSlug.trim();
  if (!key) return false;
  if (guide.id === key) return true;
  const lower = key.toLowerCase();
  if (guide.id.toLowerCase() === lower) return true;
  const slugs = [guide.webUrl, guide.webUrlEn, guide.webUrlUk]
    .map(slugFromGuideWebUrl)
    .filter(Boolean) as string[];
  return slugs.some((s) => s === lower);
}
