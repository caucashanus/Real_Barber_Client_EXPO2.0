import catalog from "@/lib/rbicek/port/data/blogPosts.generated.json";
import { CONTACT_EMAIL } from "@/lib/rbicek/port/data/branchesCatalog";

export type BlogPostEntry = {
  slug: string;
  title: string;
  excerpt: string | null;
  date: string;
  dateLabel: string;
  tag: string | null;
  webUrl: string;
};

export const BLOG_POSTS: BlogPostEntry[] = catalog.items;

export const BLOG_PAGE_SIZE = 6;

export const FEATURED_BLOG_SLUGS = [
  "vypadavani-vlasu-u-muzu",
  "fade-vs-taper",
  "pomada-vs-vosk-vs-hlina",
  "kudrnaty-vous-jak-ho-zkrotit-ne-znicit",
  "proc-muzum-padaji-vlasy-pravda-kterou-vam-vetsinou-nikdo-nevysvetli",
  "fluffy-fade-crop-nebo-buzz-jak-poznat-ktery-uces-sedne-prave-tobe",
] as const;

export const BLOG_INTRO =
  `Tipy, techniky a odpovědi na časté otázky o vlasech, vousy a péči. Máte vlastní téma? Napište na ${CONTACT_EMAIL} a zkusíme ho pro vás připravit.`;

function sanitizeUserText(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ");
}

export function blogPostNodeId(slug: string): string {
  return `blog_post_${slug.replace(/-/g, "_")}`;
}

export function blogPostPickId(slug: string): string {
  return `blog_post_pick_${slug.replace(/-/g, "_")}`;
}

export function blogPostChatMessage(post: BlogPostEntry): string {
  const parts: string[] = [`${post.title} (${post.dateLabel})`];

  if (post.excerpt) {
    parts.push(sanitizeUserText(post.excerpt));
  }

  return parts.join("\n\n");
}

export function blogPostPickLabel(post: BlogPostEntry): string {
  if (post.title.length <= 42) return post.title;
  return `${post.title.slice(0, 39).trimEnd()}...`;
}

export function getFeaturedBlogPosts(): BlogPostEntry[] {
  const bySlug = new Map(BLOG_POSTS.map((post) => [post.slug, post]));
  const featured: BlogPostEntry[] = [];

  for (const slug of FEATURED_BLOG_SLUGS) {
    const post = bySlug.get(slug);
    if (post) featured.push(post);
  }

  if (featured.length >= 6) return featured.slice(0, 6);

  const rest = BLOG_POSTS.filter(
    (post) => !featured.some((item) => item.slug === post.slug),
  ).slice(0, 6 - featured.length);

  return [...featured, ...rest];
}

export function paginateBlogPosts(
  items: BlogPostEntry[],
  pageSize = BLOG_PAGE_SIZE,
): BlogPostEntry[][] {
  const pages: BlogPostEntry[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

export const BLOG_POST_PAGES = paginateBlogPosts(BLOG_POSTS);
