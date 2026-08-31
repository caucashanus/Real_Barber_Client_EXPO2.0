import catalog from "@/lib/rbicek/port/data/teamMembers.generated.json";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  webUrl: string;
  description: string | null;
  branches: string[];
  favoriteHaircuts: string[];
  totalReviews: number;
  averageRating: number | null;
  languages: string[];
  isNew: boolean;
};

export const TEAM_MEMBERS: TeamMember[] = catalog.items;

export const TEAM_PAGE_SIZE = 6;

export const FEATURED_TEAM_SLUGS = [
  "andrea",
  "sasa",
  "mark",
  "alex",
  "karel",
  "pavel",
] as const;

function sanitizeUserText(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ");
}

export function teamMemberNodeId(slug: string): string {
  return `team_member_${slug.replace(/-/g, "_")}`;
}

export function teamMemberPickId(slug: string): string {
  return `team_member_pick_${slug.replace(/-/g, "_")}`;
}

export function teamMemberChatMessage(member: TeamMember): string {
  const parts: string[] = [];

  if (member.description) {
    parts.push(sanitizeUserText(member.description));
  }

  if (member.branches.length > 0) {
    parts.push(`Pobočky: ${member.branches.join(", ")}.`);
  }

  if (member.favoriteHaircuts.length > 0) {
    const shown = member.favoriteHaircuts.slice(0, 5);
    const suffix =
      member.favoriteHaircuts.length > shown.length ? " a další" : "";
    parts.push(`Oblíbené střihy: ${shown.join(", ")}${suffix}.`);
  }

  if (member.totalReviews > 0 && member.averageRating != null) {
    const rating = member.averageRating.toFixed(2).replace(/\.00$/, "");
    parts.push(
      `Hodnocení ${rating}/5 (${member.totalReviews} ${member.totalReviews === 1 ? "recenze" : member.totalReviews < 5 ? "recenze" : "recenzí"}).`,
    );
  }

  if (member.isNew) {
    parts.push("Nový člen týmu Real Barber.");
  }

  return parts.join("\n\n");
}

export function getFeaturedTeamMembers(): TeamMember[] {
  const bySlug = new Map(TEAM_MEMBERS.map((member) => [member.slug, member]));
  const featured: TeamMember[] = [];

  for (const slug of FEATURED_TEAM_SLUGS) {
    const member = bySlug.get(slug);
    if (member) featured.push(member);
  }

  if (featured.length >= 6) return featured.slice(0, 6);

  const rest = TEAM_MEMBERS.filter(
    (member) => !featured.some((item) => item.slug === member.slug),
  )
    .sort((a, b) => {
      if (b.totalReviews !== a.totalReviews) {
        return b.totalReviews - a.totalReviews;
      }
      return a.name.localeCompare(b.name, "cs");
    })
    .slice(0, 6 - featured.length);

  return [...featured, ...rest];
}

export function paginateTeamMembers(
  items: TeamMember[],
  pageSize = TEAM_PAGE_SIZE,
): TeamMember[][] {
  const pages: TeamMember[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

export const TEAM_MEMBER_PAGES = paginateTeamMembers(TEAM_MEMBERS);
