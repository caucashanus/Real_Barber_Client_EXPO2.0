import type { BranchContactId } from "@/lib/rbicek/port/data/branchContacts";

/** Odkazy na Google recenze poboček (stejné jako na webu Real Barber). */
export const BRANCH_GOOGLE_REVIEW_URLS: Record<BranchContactId, string> = {
  kacerov:
    "https://www.google.com/maps/place//data=!4m3!3m2!1s0x470b939017c51e23:0x92b42ccae1f9e4d2!12e1?source=g.page.m.nr._&laa=nmx-review-solicitation-recommendation-card",
  modrany:
    "https://www.google.com/maps/place//data=!4m3!3m2!1s0x470b9106cce70fe9:0x5a1a3d95834f42e0!12e1?source=g.page.m.nr._&laa=nmx-review-solicitation-recommendation-card",
  hagibor:
    "https://www.google.com/maps/place//data=!4m3!3m2!1s0x470b93864ce2026d:0x79da71f13886a829!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2",
  barrandov:
    "https://www.google.com/maps/place//data=!4m3!3m2!1s0x470b973863b19105:0x330bb8148390492f!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2",
};

export const BRANCH_GOOGLE_REVIEW_ORDER: BranchContactId[] = [
  "kacerov",
  "modrany",
  "hagibor",
  "barrandov",
];

const BRANCH_REVIEW_LABELS: Record<BranchContactId, string> = {
  kacerov: "Ohodnotit Kačerov",
  modrany: "Ohodnotit Modřany",
  hagibor: "Ohodnotit Hagibor",
  barrandov: "Ohodnotit Barrandov",
};

export function branchGoogleReviewLabel(id: BranchContactId): string {
  return BRANCH_REVIEW_LABELS[id];
}
