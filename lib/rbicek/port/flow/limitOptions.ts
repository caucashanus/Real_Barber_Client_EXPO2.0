import type { FlowOption } from "@/lib/rbicek/port/types/chat";

export const MAX_RESPONSE_OPTIONS = 9;

/** Nižší skóre = důležitější, při ořezu se nejdřív odstraní vyšší skóre. */
function optionDropScore(option: FlowOption, index: number): number {
  const pinned: Record<string, number> = {
    cross_slots: 10,
    cross_team: 12,
    cross_team_catalog: 14,
    cross_branches_catalog: 14,
    cross_branches: 12,
    cross_guide: 12,
    cross_bookings: 12,
    cross_waitlist: 14,
    cross_lost_found: 14,
    cross_situations: 12,
    cross_outside_salon: 14,
    back_menu: 20,
    back_svc_haircuts: 20,
    back_team_members: 20,
    back_branches: 20,
    back_blog: 20,
    back_misc: 22,
    back_faq: 22,
  };
  if (pinned[option.id] != null) return pinned[option.id];

  const dropFirst: Record<string, number> = {
    follow_done: 1000,
    // Keep contact chip visible while live operator is off (was 950 = dropped first).
    follow_operator: 40,
    follow_menu: 900,
    team_members_web: 880,
    branches_contacts_web: 880,
    blog_web: 880,
    svc_haircuts_catalog: 880,
    cross_misc: 860,
    cross_gdpr: 840,
    cross_careers: 820,
  };
  if (dropFirst[option.id] != null) return dropFirst[option.id];

  if (option.id.startsWith("haircut_barber_")) return 45;
  if (option.id.startsWith("haircut_similar_")) return 50;
  if (option.id.startsWith("follow_")) return 930;
  if (option.id.endsWith("_book")) return 780;
  if (option.id.startsWith("cross_")) return 520;
  if (option.id.includes("_prev") || option.id.includes("_next")) return 90;
  if (option.id.startsWith("back_")) return 80;
  if (option.action === "openUrl") return 420 + index * 0.01;

  return 300 + index;
}

/** Ořízne quick reply na max. 9 položek, ponechá pořadí v UI. */
export function limitResponseOptions(
  options: FlowOption[],
  max = MAX_RESPONSE_OPTIONS,
): FlowOption[] {
  if (options.length <= max) return options;

  const ranked = options.map((option, index) => ({
    option,
    index,
    dropScore: optionDropScore(option, index),
  }));

  ranked.sort((a, b) => {
    if (b.dropScore !== a.dropScore) return b.dropScore - a.dropScore;
    return b.index - a.index;
  });

  const dropCount = options.length - max;
  const dropIds = new Set(
    ranked.slice(0, dropCount).map((entry) => entry.option.id),
  );

  return options.filter((option) => !dropIds.has(option.id));
}
