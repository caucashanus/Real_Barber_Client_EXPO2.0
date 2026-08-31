import type { WidgetLocale } from "@/lib/rbicek/port/types/config";
import type {
  FlowDefinition,
  FlowNode,
  FlowOption,
  ChatMessage,
} from "@/lib/rbicek/port/types/chat";
import { flowMessage, flowMessageLoggedIn, localizeOptions } from "@/lib/rbicek/port/i18n/flow";
import { tSystem } from "@/lib/rbicek/port/i18n/system";
import { withoutDashes } from "@/lib/rbicek/port/i18n/locale";

import {
  BRANCH_GOOGLE_REVIEW_ORDER,
  BRANCH_GOOGLE_REVIEW_URLS,
  branchGoogleReviewLabel,
} from "@/lib/rbicek/port/data/branchGoogleReviews";
import {
  INSPIRACE_HAIRCUTS,
  INSPIRACE_HAIRCUT_PAGES,
  getFeaturedHaircuts,
  haircutChatMessage,
  haircutNodeId,
  haircutPickId,
  type InspiraceHaircut,
} from "@/lib/rbicek/port/data/inspiraceHaircuts";
import {
  TEAM_MEMBERS,
  TEAM_MEMBER_PAGES,
  getFeaturedTeamMembers,
  teamMemberChatMessage,
  teamMemberNodeId,
  teamMemberPickId,
  type TeamMember,
} from "@/lib/rbicek/port/data/teamMembers";
import {
  BRANCHES_CATALOG,
  CONTACTS_INTRO,
  branchChatMessage,
  branchNodeId,
  branchPickId,
  type BranchCatalogEntry,
} from "@/lib/rbicek/port/data/branchesCatalog";
import {
  BLOG_POSTS,
  BLOG_POST_PAGES,
  BLOG_INTRO,
  blogPostChatMessage,
  blogPostNodeId,
  blogPostPickId,
  blogPostPickLabel,
  getFeaturedBlogPosts,
  type BlogPostEntry,
} from "@/lib/rbicek/port/data/blogPosts";
import { limitResponseOptions } from "@/lib/rbicek/port/flow/limitOptions";
import {
  OPERATOR_CONTACT_NODE_ID,
  operatorContactChannelOptions,
  operatorContactMessage,
  operatorEntryOption,
} from "@/lib/rbicek/port/lib/liveOperator";
import { isJokeNodeId } from "@/lib/rbicek/port/data/jokes";

const OPERATOR_OPTION_ID = "follow_operator";

/** Kontakt / operátor vždy jako poslední chip. */
function moveOperatorLast(options: FlowOption[]): FlowOption[] {
  const operator = options.filter((option) => option.id === OPERATOR_OPTION_ID);
  if (!operator.length) return options;
  return [
    ...options.filter((option) => option.id !== OPERATOR_OPTION_ID),
    ...operator,
  ];
}

const BACK = { id: "back_menu", label: "Zpět do menu", nextNodeId: "main_menu" };
const BACK_FAQ = {
  id: "back_faq",
  label: "Zpět na dotazy o aplikaci",
  nextNodeId: "app_faq_menu",
};
const BACK_MISC = {
  id: "back_misc",
  label: "Zpět",
  nextNodeId: "misc_menu",
};

const TO_SLOTS: FlowOption = {
  id: "cross_slots",
  label: "Nejbližší termíny",
  nextNodeId: "api_slots",
};
const TO_TEAM: FlowOption = {
  id: "cross_team",
  label: "Kdo dnes pracuje",
  nextNodeId: "api_team",
};
const TO_TEAM_CATALOG: FlowOption = {
  id: "cross_team_catalog",
  label: "Profily holičů",
  nextNodeId: "team_members_menu",
};
const TO_BRANCHES: FlowOption = {
  id: "cross_branches",
  label: "Pobočky",
  nextNodeId: "api_branches",
};
const TO_BRANCHES_CATALOG: FlowOption = {
  id: "cross_branches_catalog",
  label: "Kontakty a pobočky",
  nextNodeId: "branches_menu",
};
const TO_BLOG: FlowOption = {
  id: "cross_blog",
  label: "Blog",
  nextNodeId: "blog_menu",
};
const TO_BOOKINGS: FlowOption = {
  id: "cross_bookings",
  label: "Moje rezervace",
  nextNodeId: "bookings_menu",
};
const TO_HOURS: FlowOption = {
  id: "cross_hours",
  label: "Otevírací doba",
  nextNodeId: "svc_hours_answer",
};
const TO_OPERATOR: FlowOption = operatorEntryOption();
const CALL_SUPPORT: FlowOption = {
  id: "call_support",
  label: "Zavolat +420 608 332 881",
  nextNodeId: "after_help",
  action: "openUrl",
  url: "tel:+420608332881",
};
const EMAIL_SUPPORT: FlowOption = {
  id: "email_support",
  label: "Napsat e-mail",
  nextNodeId: "after_help",
  action: "openUrl",
  url: "mailto:info@realbarber.cz",
};
const CALL_IT_SUPPORT: FlowOption = {
  id: "call_it_support",
  label: "IT podpora +420 774 522 114",
  nextNodeId: "after_help",
  action: "openUrl",
  url: "tel:+420774522114",
};
const TO_LOST_FOUND: FlowOption = {
  id: "cross_lost_found",
  label: "Zapomněl jsem si u vás něco",
  nextNodeId: "lost_found_menu",
};
const TO_APP: FlowOption = {
  id: "cross_app",
  label: "Aplikace Real Barber",
  nextNodeId: "app_promo",
};
const TO_GDPR: FlowOption = {
  id: "cross_gdpr",
  label: "Ochrana osobních údajů",
  nextNodeId: "gdpr_answer",
};
const TO_CAREERS: FlowOption = {
  id: "cross_careers",
  label: "Pracovní příležitosti",
  nextNodeId: "careers_answer",
};
const TO_MISC: FlowOption = {
  id: "cross_misc",
  label: "Jiné",
  nextNodeId: "misc_menu",
};
const TO_GUIDE: FlowOption = {
  id: "cross_guide",
  label: "Nevím, co potřebuji",
  nextNodeId: "guide_menu",
};
const TO_SITUATIONS: FlowOption = {
  id: "cross_situations",
  label: "Situace a pomoc",
  nextNodeId: "situations_menu",
};
const TO_OUTSIDE_SALON: FlowOption = {
  id: "cross_outside_salon",
  label: "Mimo salon",
  nextNodeId: "outside_salon_menu",
};
const TO_WAITLIST: FlowOption = {
  id: "cross_waitlist",
  label: "Čekací listina",
  nextNodeId: "waitlist_answer",
};
const TO_GIFT_VOUCHER: FlowOption = {
  id: "cross_gift_voucher",
  label: "Dárkový poukaz",
  nextNodeId: "gift_voucher_answer",
};
const TO_PROMO: FlowOption = {
  id: "cross_promo",
  label: "Akce a kupóny",
  nextNodeId: "api_promo",
};
const TO_COUPON_ISSUE: FlowOption = {
  id: "pay_coupon_issue",
  label: "Nejde mi uplatnit kupón",
  nextNodeId: "pay_coupon_issue_answer",
};
const TO_BOOKINGS_MANAGE: FlowOption = {
  id: "cross_bookings_manage",
  label: "Spravovat rezervaci",
  nextNodeId: "bookings_manage_menu",
};
const TO_BA_SHARE: FlowOption = {
  id: "ba_share",
  label: "Sdílet rezervaci",
  nextNodeId: "ba_share_answer",
};
const TO_BA_SHARE_RECIPIENT: FlowOption = {
  id: "ba_share_recipient",
  label: "Co uvidí příjemce?",
  nextNodeId: "ba_share_recipient_answer",
};
const OPEN_BOOKINGS: FlowOption = {
  id: "open_bookings",
  label: "Otevřít moje rezervace",
  nextNodeId: "bookings_open_confirm",
  action: "openReservations",
};

/** Po rozloučení vždy nabídnout návrat do konverzace. */
const GOODBYE_FOLLOWUP: FlowOption[] = [
  { id: "goodbye_menu", label: "Zpět do menu", nextNodeId: "main_menu" },
  { id: "goodbye_joke", label: "Zobrazit vtip", nextNodeId: "goodbye_joke" },
];

const IDLE_RESUME_OPTIONS: FlowOption[] = [
  { id: "idle_menu", label: "Zpět do menu", nextNodeId: "main_menu" },
  TO_SLOTS,
  TO_TEAM,
];

const SAT_HAPPY_GOOGLE_REVIEW_OPTIONS: FlowOption[] =
  BRANCH_GOOGLE_REVIEW_ORDER.map((branchId) => ({
    id: `sat_review_${branchId}`,
    label: branchGoogleReviewLabel(branchId),
    nextNodeId: "sat_happy_review_thanks",
    action: "openUrl" as const,
    url: BRANCH_GOOGLE_REVIEW_URLS[branchId],
  }));

/** Hlavní quick replies na welcome a off-topic guard (max 9, nic se neořezává). */
export const WELCOME_QUICK_OPTIONS: FlowOption[] = [
  {
    id: "quick_slots",
    label: "Nejbližší termíny",
    nextNodeId: "api_slots",
  },
  {
    id: "quick_bookings",
    label: "Moje rezervace",
    nextNodeId: "bookings_menu",
  },
  {
    id: "quick_team",
    label: "Kdo dnes pracuje",
    nextNodeId: "api_team",
  },
  {
    id: "quick_branches",
    label: "Pobočky",
    nextNodeId: "api_branches",
  },
  {
    id: "quick_services",
    label: "Služby a ceník",
    nextNodeId: "services_menu",
  },
  {
    id: "quick_satisfaction",
    label: "Spokojenost / reklamace",
    nextNodeId: "satisfaction_menu",
  },
  TO_SITUATIONS,
  TO_GUIDE,
  TO_OPERATOR,
];

const WELCOME_QUICK_OPTIONS_LOGGED_IN: FlowOption[] = [
  WELCOME_QUICK_OPTIONS[0]!,
  {
    id: "quick_bookings_logged",
    label: "Moje nejbližší rezervace",
    nextNodeId: "bookings_menu",
  },
  ...WELCOME_QUICK_OPTIONS.slice(2),
];

export function getStartNodeId(isLoggedIn: boolean): string {
  return isLoggedIn ? "welcome_logged_in" : "welcome";
}

const WELCOME_HUB_TEXT =
  "Dobrý den! Jsem Rbíček, Váš osobní asistent.\nVyberte téma níže, nebo napište, s čím potřebujete pomoct.";

export function getWelcomeMessage(
  isLoggedIn: boolean,
  userDisplayName?: string,
  locale: WidgetLocale = "cs",
): string {
  if (isLoggedIn) {
    const firstName = userDisplayName?.trim().split(/\s+/)[0];
    if (firstName) {
      return tSystem("welcomeNamed", locale, { name: firstName });
    }
    return tSystem("welcomeLogged", locale);
  }
  return tSystem("welcomeHub", locale);
}

export function resolveNodeMessage(
  node: { id?: string; message: string; messageLoggedIn?: string } | undefined,
  isLoggedIn: boolean,
  locale: WidgetLocale = "cs",
): string {
  if (!node) return "";
  // Joke text is drawn in chatStore via takeNextJoke (deck + exhausted state).
  if (isJokeNodeId(node.id)) return withoutDashes(node.message);
  if (node.id === OPERATOR_CONTACT_NODE_ID) {
    return operatorContactMessage(new Date(), locale);
  }
  if (isLoggedIn && node.messageLoggedIn) {
    return flowMessageLoggedIn(node.id, node.messageLoggedIn, locale);
  }
  return flowMessage(node.id, node.message, locale);
}

/** Chips under a joke bubble: hide „Ještě jeden“ when the deck is empty. */
export function jokeReplyOptions(
  hasMore: boolean,
  locale: WidgetLocale = "cs",
): FlowOption[] {
  const options: FlowOption[] = [
    {
      id: "goodbye_joke_menu",
      label: "Zpět do menu",
      nextNodeId: "main_menu",
    },
  ];
  if (hasMore) {
    options.push({
      id: "goodbye_joke_more",
      label: "Ještě jeden vtip",
      nextNodeId: "goodbye_joke",
    });
  }
  return localizeOptions(options, locale);
}

const BACK_SVC_HAIRCUTS: FlowOption = {
  id: "back_svc_haircuts",
  label: "Zpět na účesy",
  nextNodeId: "svc_haircuts_menu",
};

function buildHaircutFlowNodes(): Record<string, FlowNode> {
  const featured = getFeaturedHaircuts();

  const menuNode: FlowNode = {
    id: "svc_haircuts_menu",
    message:
      "Inspirace pro výběr pánského účesu. U každého stylu najdete popis, pro koho se hodí a vhodné tvary obličeje. Na konkrétní účes se můžete rovnou objednat.\n\nHolič vždy posoudí, zda vám účes sedí podle tvaru hlavy a stavu vlasů. Klidně si přineste fotku inspirace.",
    options: [
      ...featured.map((haircut) => ({
        id: haircutPickId(haircut.slug),
        label: haircut.name,
        nextNodeId: haircutNodeId(haircut.slug),
      })),
      {
        id: "svc_haircuts_browse",
        label: `Všechny účesy (${INSPIRACE_HAIRCUTS.length})`,
        nextNodeId: "svc_haircuts_all_p0",
      },
      {
        id: "svc_haircuts_catalog",
        label: "Katalog na webu",
        nextNodeId: "after_help",
        action: "openUrl",
        url: "/inspirace/",
      },
      BACK,
    ],
  };

  const pageNodes = Object.fromEntries(
    INSPIRACE_HAIRCUT_PAGES.map((page, pageIndex) => {
      const nodeId = `svc_haircuts_all_p${pageIndex}`;
      const from = pageIndex * page.length + 1;
      const to = from + page.length - 1;
      const options: FlowOption[] = page.map((haircut) => ({
        id: haircutPickId(haircut.slug),
        label: haircut.name,
        nextNodeId: haircutNodeId(haircut.slug),
      }));

      if (pageIndex > 0) {
        options.push({
          id: `svc_haircuts_all_p${pageIndex}_prev`,
          label: "Předchozí",
          nextNodeId: `svc_haircuts_all_p${pageIndex - 1}`,
        });
      }

      if (pageIndex < INSPIRACE_HAIRCUT_PAGES.length - 1) {
        options.push({
          id: `svc_haircuts_all_p${pageIndex}_next`,
          label: "Další účesy",
          nextNodeId: `svc_haircuts_all_p${pageIndex + 1}`,
        });
      }

      options.push(BACK_SVC_HAIRCUTS);

      return [
        nodeId,
        {
          id: nodeId,
          message: `Účesy ${from}-${to} z ${INSPIRACE_HAIRCUTS.length}. Vyberte styl pro detail a odkaz na web.`,
          options,
        } satisfies FlowNode,
      ];
    }),
  );

  const answerNodes = Object.fromEntries(
    INSPIRACE_HAIRCUTS.map((haircut) => {
      const nodeId = haircutNodeId(haircut.slug);
      return [
        nodeId,
        buildHaircutAnswerNode(haircut, nodeId),
      ];
    }),
  );

  return { svc_haircuts_menu: menuNode, ...pageNodes, ...answerNodes };
}

function buildHaircutAnswerNode(
  haircut: InspiraceHaircut,
  nodeId: string,
): FlowNode {
  const barberOptions = haircut.barbers
    .filter((barber) => barber.webUrl)
    .slice(0, 3)
    .map((barber, index) => ({
      id: `haircut_barber_${haircut.slug.replace(/-/g, "_")}_${index}`,
      label: `Holič: ${barber.name}`,
      nextNodeId: "after_help",
      action: "openUrl" as const,
      url: barber.webUrl!,
    }));

  const similarOptions = haircut.similar
    .filter((item) => item.webUrl || item.slug)
    .slice(0, 2)
    .map((item, index) => {
      const similarNodeId =
        item.slug && flowHasHaircutNode(item.slug)
          ? haircutNodeId(item.slug)
          : null;
      if (similarNodeId) {
        return {
          id: `haircut_similar_${haircut.slug.replace(/-/g, "_")}_${index}`,
          label: `Podobný: ${item.name}`,
          nextNodeId: similarNodeId,
        };
      }
      return {
        id: `haircut_similar_${haircut.slug.replace(/-/g, "_")}_${index}`,
        label: `Podobný: ${item.name}`,
        nextNodeId: "after_help",
        action: "openUrl" as const,
        url: item.webUrl ?? `/sluzby/${item.slug}/`,
      };
    });

  return {
    id: nodeId,
    message: haircutChatMessage(haircut),
    showFollowUp: true,
    options: [
      {
        id: `${nodeId}_web`,
        label: `Detail: ${haircut.name}`,
        nextNodeId: "after_help",
        action: "openUrl",
        url: haircut.webUrl,
      },
      ...barberOptions,
      ...similarOptions,
      TO_SLOTS,
      BACK_SVC_HAIRCUTS,
    ],
  };
}

function flowHasHaircutNode(slug: string): boolean {
  return INSPIRACE_HAIRCUTS.some((item) => item.slug === slug);
}

const BACK_TEAM_MEMBERS: FlowOption = {
  id: "back_team_members",
  label: "Zpět na tým",
  nextNodeId: "team_members_menu",
};

function buildTeamFlowNodes(): Record<string, FlowNode> {
  const featured = getFeaturedTeamMembers();

  const menuNode: FlowNode = {
    id: "team_members_menu",
    message:
      "Tým barberů Real Barber v Praze. U každého holiče najdete popis, pobočky, oblíbené střihy a hodnocení od klientů.\n\nVyberte holiče podle stylu nebo si nejdřív prohlédněte, kdo dnes pracuje. Po kliknutí na profil na webu uvidíte ukázky práce, směny a volné termíny.",
    options: [
      ...featured.map((member) => ({
        id: teamMemberPickId(member.slug),
        label: member.isNew ? `${member.name} (nový)` : member.name,
        nextNodeId: teamMemberNodeId(member.slug),
      })),
      {
        id: "team_members_browse",
        label: `Všichni holiči (${TEAM_MEMBERS.length})`,
        nextNodeId: "team_members_all_p0",
      },
      TO_TEAM,
      {
        id: "team_members_web",
        label: "Tým na webu",
        nextNodeId: "after_help",
        action: "openUrl",
        url: "/tym/",
      },
      BACK,
    ],
  };

  const pageNodes = Object.fromEntries(
    TEAM_MEMBER_PAGES.map((page, pageIndex) => {
      const nodeId = `team_members_all_p${pageIndex}`;
      const from = pageIndex * page.length + 1;
      const to = from + page.length - 1;
      const options: FlowOption[] = page.map((member) => ({
        id: teamMemberPickId(member.slug),
        label: member.isNew ? `${member.name} (nový)` : member.name,
        nextNodeId: teamMemberNodeId(member.slug),
      }));

      if (pageIndex > 0) {
        options.push({
          id: `team_members_all_p${pageIndex}_prev`,
          label: "Předchozí",
          nextNodeId: `team_members_all_p${pageIndex - 1}`,
        });
      }

      if (pageIndex < TEAM_MEMBER_PAGES.length - 1) {
        options.push({
          id: `team_members_all_p${pageIndex}_next`,
          label: "Další holiči",
          nextNodeId: `team_members_all_p${pageIndex + 1}`,
        });
      }

      options.push(BACK_TEAM_MEMBERS);

      return [
        nodeId,
        {
          id: nodeId,
          message: `Holiči ${from}-${to} z ${TEAM_MEMBERS.length}. Vyberte profil pro detail a odkaz na web.`,
          options,
        } satisfies FlowNode,
      ];
    }),
  );

  const answerNodes = Object.fromEntries(
    TEAM_MEMBERS.map((member) => {
      const nodeId = teamMemberNodeId(member.slug);
      return [nodeId, buildTeamMemberAnswerNode(member, nodeId)];
    }),
  );

  return { team_members_menu: menuNode, ...pageNodes, ...answerNodes };
}

function buildTeamMemberAnswerNode(
  member: TeamMember,
  nodeId: string,
): FlowNode {
  return {
    id: nodeId,
    message: teamMemberChatMessage(member),
    showFollowUp: true,
    options: [
      {
        id: `${nodeId}_web`,
        label: `Profil: ${member.name}`,
        nextNodeId: "after_help",
        action: "openUrl",
        url: member.webUrl,
      },
      TO_SLOTS,
      TO_TEAM,
      BACK_TEAM_MEMBERS,
    ],
  };
}

const BACK_BRANCHES: FlowOption = {
  id: "back_branches",
  label: "Zpět na pobočky",
  nextNodeId: "branches_menu",
};

function buildBranchFlowNodes(): Record<string, FlowNode> {
  const menuNode: FlowNode = {
    id: "branches_menu",
    message: CONTACTS_INTRO,
    options: [
      ...BRANCHES_CATALOG.map((branch) => ({
        id: branchPickId(branch.id),
        label: `${branch.name} (${branch.district})`,
        nextNodeId: branchNodeId(branch.id),
      })),
      {
        id: "branches_carousel",
        label: "Přehled s fotkami",
        nextNodeId: "api_branches",
      },
      {
        id: "branches_map",
        label: "Mapa poboček",
        nextNodeId: "after_help",
        action: "openUrl",
        url: "/mapa/",
      },
      {
        id: "branches_contacts_web",
        label: "Kontakty na webu",
        nextNodeId: "after_help",
        action: "openUrl",
        url: "/kontakty/",
      },
      BACK,
    ],
  };

  const answerNodes = Object.fromEntries(
    BRANCHES_CATALOG.map((branch) => {
      const nodeId = branchNodeId(branch.id);
      return [nodeId, buildBranchAnswerNode(branch, nodeId)];
    }),
  );

  return { branches_menu: menuNode, ...answerNodes };
}

function buildBranchAnswerNode(
  branch: BranchCatalogEntry,
  nodeId: string,
): FlowNode {
  return {
    id: nodeId,
    message: branchChatMessage(branch),
    showFollowUp: true,
    options: [
      {
        id: `${nodeId}_web`,
        label: `Detail: ${branch.name}`,
        nextNodeId: "after_help",
        action: "openUrl",
        url: branch.webUrl,
      },
      {
        id: `${nodeId}_maps`,
        label: "Google Mapy",
        nextNodeId: "after_help",
        action: "openUrl",
        url: branch.mapsUrl,
      },
      {
        id: `${nodeId}_waze`,
        label: "Waze",
        nextNodeId: "after_help",
        action: "openUrl",
        url: branch.wazeUrl,
      },
      TO_SLOTS,
      BACK_BRANCHES,
    ],
  };
}

const BACK_BLOG: FlowOption = {
  id: "back_blog",
  label: "Zpět na blog",
  nextNodeId: "blog_menu",
};

function buildBlogFlowNodes(): Record<string, FlowNode> {
  const featured = getFeaturedBlogPosts();

  const menuNode: FlowNode = {
    id: "blog_menu",
    message: BLOG_INTRO,
    options: [
      ...featured.map((post) => ({
        id: blogPostPickId(post.slug),
        label: blogPostPickLabel(post),
        nextNodeId: blogPostNodeId(post.slug),
      })),
      {
        id: "blog_browse",
        label: `Všechny články (${BLOG_POSTS.length})`,
        nextNodeId: "blog_all_p0",
      },
      {
        id: "blog_web",
        label: "Blog na webu",
        nextNodeId: "after_help",
        action: "openUrl",
        url: "/blog/",
      },
      BACK,
    ],
  };

  const pageNodes = Object.fromEntries(
    BLOG_POST_PAGES.map((page, pageIndex) => {
      const nodeId = `blog_all_p${pageIndex}`;
      const from = pageIndex * page.length + 1;
      const to = from + page.length - 1;
      const options: FlowOption[] = page.map((post) => ({
        id: blogPostPickId(post.slug),
        label: blogPostPickLabel(post),
        nextNodeId: blogPostNodeId(post.slug),
      }));

      if (pageIndex > 0) {
        options.push({
          id: `blog_all_p${pageIndex}_prev`,
          label: "Předchozí",
          nextNodeId: `blog_all_p${pageIndex - 1}`,
        });
      }

      if (pageIndex < BLOG_POST_PAGES.length - 1) {
        options.push({
          id: `blog_all_p${pageIndex}_next`,
          label: "Další články",
          nextNodeId: `blog_all_p${pageIndex + 1}`,
        });
      }

      options.push(BACK_BLOG);

      return [
        nodeId,
        {
          id: nodeId,
          message: `Články ${from}-${to} z ${BLOG_POSTS.length}. Vyberte článek pro náhled a odkaz na web.`,
          options,
        } satisfies FlowNode,
      ];
    }),
  );

  const answerNodes = Object.fromEntries(
    BLOG_POSTS.map((post) => {
      const nodeId = blogPostNodeId(post.slug);
      return [nodeId, buildBlogPostAnswerNode(post, nodeId)];
    }),
  );

  return { blog_menu: menuNode, ...pageNodes, ...answerNodes };
}

function buildBlogPostAnswerNode(
  post: BlogPostEntry,
  nodeId: string,
): FlowNode {
  return {
    id: nodeId,
    message: blogPostChatMessage(post),
    showFollowUp: true,
    options: [
      {
        id: `${nodeId}_web`,
        label: "Číst celý článek",
        nextNodeId: "after_help",
        action: "openUrl",
        url: post.webUrl,
      },
      TO_SLOTS,
      BACK_BLOG,
    ],
  };
}

export const flowDefinition: FlowDefinition = {
  startNodeId: "welcome",
  followUpNodeId: "after_help",
  followUpOptions: [
    { id: "follow_menu", label: "Zpět do menu", nextNodeId: "main_menu" },
    {
      id: "follow_done",
      label: "Hotovo, díky",
      nextNodeId: "goodbye",
    },
    TO_OPERATOR,
  ],
  nodes: {
    welcome: {
      id: "welcome",
      message: WELCOME_HUB_TEXT,
      options: WELCOME_QUICK_OPTIONS,
    },

    welcome_logged_in: {
      id: "welcome_logged_in",
      message:
        "Zdravím! Jsem Rbíček, váš asistent Real Barber.\nVyberte téma níže, nebo napište, s čím potřebujete pomoct.",
      options: WELCOME_QUICK_OPTIONS_LOGGED_IN,
    },

    main_menu: {
      id: "main_menu",
      message:
        "Hlavní menu. Vyberte sekci, nebo napište, s čím potřebujete pomoct.",
      options: [
        {
          id: "menu_bookings",
          label: "Moje rezervace",
          nextNodeId: "bookings_menu",
        },
        {
          id: "menu_services",
          label: "Služby, ceník, účesy",
          nextNodeId: "services_menu",
        },
        {
          id: "menu_coins",
          label: "RB Coiny & aplikace",
          nextNodeId: "app_menu",
        },
        {
          id: "menu_payments",
          label: "Platby & dárkové poukazy",
          nextNodeId: "payments_menu",
        },
        TO_PROMO,
        TO_SITUATIONS,
        TO_OUTSIDE_SALON,
        {
          id: "menu_misc",
          label: "Jiné",
          nextNodeId: "misc_menu",
        },
      ],
    },

    /* ── GDPR ── */
    info_menu: {
      id: "info_menu",
      message:
        "Informace o ochraně osobních údajů a právech zákazníků Real Barber.",
      options: [TO_GDPR, BACK],
    },
    misc_menu: {
      id: "misc_menu",
      message:
        "Další informace o Real Barber. Vyberte téma.",
      options: [
        {
          id: "misc_first_visit",
          label: "První návštěva",
          nextNodeId: "svc_first_answer",
        },
        {
          id: "misc_interior",
          label: "Interiér salonů",
          nextNodeId: "interior_answer",
        },
        {
          id: "misc_appearance",
          label: "Vzhled a barevnost",
          nextNodeId: "appearance_answer",
        },
        TO_GDPR,
        TO_BRANCHES_CATALOG,
        TO_BLOG,
        TO_CAREERS,
        BACK,
      ],
    },
    appearance_answer: {
      id: "appearance_answer",
      message:
        "Na webu i v aplikaci si můžete upravit vzhled. Je to spíš frajeřinka, ale hodí se, když chcete tmavý režim nebo jinou barvu tlačítek.\n\nVzhled stránky: Systém / Tmavý / Světlý.\nBarevnost: vlastní zvýrazňovací barva (tlačítka a aktivní prvky).\n\nPřihlášení: Profil → Tmavý nebo Světlý režim, hned pod tím Barevnost.\nBez přihlášení: Menu (spodní lišta) → stejné položky.\nNa počítači je přepínač vzhledu i v horní liště.",
      showFollowUp: true,
      options: [BACK_MISC, TO_APP],
    },
    interior_answer: {
      id: "interior_answer",
      message:
        "Naše pánské salony v Praze mají moderní interiér, vyváženou hudbu a prostředí pro relaxaci. Nejde jen o střih: nabízíme prémiový servis, moderní trendy i osobní přístup s důrazem na detail.",
      showFollowUp: true,
      options: [
        {
          id: "interior_web",
          label: "Fotky interiéru",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/interier/",
        },
        TO_BRANCHES,
        BACK_MISC,
      ],
    },
    gdpr_answer: {
      id: "gdpr_answer",
      message:
        "Real Barber s.r.o. zpracovává osobní údaje v souladu s GDPR. Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a námitku. Žádosti posílejte na info@realbarber.cz nebo volejte +420 608 332 881. Odpovídáme obvykle do 30 dnů.\n\nSmazání účtu v aplikaci: napište na info@realbarber.cz, uveďte e-mail nebo telefon z účtu a že žádáte o smazání. Vyřizujeme obvykle do 5 dnů.",
      showFollowUp: true,
      options: [
        {
          id: "gdpr_full",
          label: "Celé znění GDPR",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/ochrana-osobnich-udaju/",
        },
        {
          id: "gdpr_delete",
          label: "Smazat účet v aplikaci",
          nextNodeId: "gdpr_delete_answer",
        },
        BACK,
      ],
    },
    gdpr_delete_answer: {
      id: "gdpr_delete_answer",
      message:
        "Pro smazání účtu v aplikaci Real Barber napište na info@realbarber.cz. Uveďte, že žádáte o smazání účtu, a e-mail nebo telefon, kterým se v aplikaci přihlašujete. Volitelně jméno a příjmení pro rychlejší dohledání. Po ověření smažeme profil a související data, obvykle do 5 dnů. Některé záznamy můžeme uchovat dle zákona (účetnictví, daně).",
      showFollowUp: true,
      options: [
        {
          id: "gdpr_delete_email",
          label: "Napsat e-mail",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "mailto:info@realbarber.cz?subject=Zadost%20o%20smazani%20uctu",
        },
        {
          id: "gdpr_delete_full",
          label: "Podrobnosti na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/ochrana-osobnich-udaju/",
        },
        BACK,
      ],
    },
    careers_answer: {
      id: "careers_answer",
      message:
        "Volné pozice řešíme individuálně. Zavolejte na +420 608 332 881, operátor vás spojí s Adminem. Stáž i rekvalifikace jsou možné po domluvě s RB Academy. Aktuální nabídky najdete i na webu.",
      showFollowUp: true,
      options: [
        {
          id: "careers_web",
          label: "Pracovní příležitosti",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/prace/",
        },
        CALL_SUPPORT,
        TO_OPERATOR,
        {
          id: "careers_ig",
          label: "Instagram @realbarber.jh",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "https://www.instagram.com/realbarber.jh/",
        },
        BACK_MISC,
      ],
    },

    /* ── Ztráty a nálezy ── */
    lost_found_menu: {
      id: "lost_found_menu",
      message:
        "Zapomněli jste si u nás něco, nebo jste na pobočce našli cizí věc? Vyberte, co potřebujete.",
      options: [
        {
          id: "lost_report",
          label: "Zapomněl jsem si u vás něco",
          nextNodeId: "lost_item_answer",
        },
        {
          id: "lost_found_report",
          label: "Našel jsem u vás věc",
          nextNodeId: "found_item_answer",
        },
        {
          id: "lost_storage",
          label: "Jak dlouho věci schováváte?",
          nextNodeId: "lost_storage_answer",
        },
        {
          id: "lost_valuables",
          label: "Cennosti a doklady",
          nextNodeId: "lost_valuables_answer",
        },
        {
          id: "lost_pickup",
          label: "Vyzvednutí a zaslání",
          nextNodeId: "lost_pickup_answer",
        },
        BACK,
      ],
    },
    lost_item_answer: {
      id: "lost_item_answer",
      message:
        "Nahlaste prosím ztrátu operátorovi, který ji začne okamžitě řešit na čísle +420 608 332 881. Případně nám můžete napsat na info@realbarber.cz.\n\nUveďte datum a čas návštěvy, pobočku a popis ztraceného předmětu. My následně začneme okamžitě hledat vaši ztracenou věc.\n\nOperátor (živý support pro všechny pobočky) je dostupný na +420 608 332 881.",
      showFollowUp: true,
      options: [
        CALL_SUPPORT,
        EMAIL_SUPPORT,
        {
          id: "lost_item_more",
          label: "Další info o ztrátách",
          nextNodeId: "lost_found_menu",
        },
      ],
    },
    found_item_answer: {
      id: "found_item_answer",
      message:
        "Pokud naleznete jakýkoliv předmět, který se zdá být ztracený, nahlaste to kolegům na provozovně, nebo podpoře na čísle +420 608 332 881 či e-mailem na info@realbarber.cz.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT, TO_BRANCHES],
    },
    lost_storage_answer: {
      id: "lost_storage_answer",
      message:
        "Ztráty a nálezy běžně neskladujeme dlouhodobě přímo na provozovnách. Během jednoho pracovního týdne jsou zpravidla odvezeny na centrální sklad.\n\nPokud dojdeme k závěru, že ztracená věc nemá zůstatkovou hodnotu a nikdo se o ni nepřihlásí, vyhrazujeme si právo ji po 7 dnech vyhodit.",
      showFollowUp: true,
      options: [
        {
          id: "lost_storage_back",
          label: "Zpět na ztráty a nálezy",
          nextNodeId: "lost_found_menu",
        },
        CALL_SUPPORT,
      ],
    },
    lost_valuables_answer: {
      id: "lost_valuables_answer",
      message:
        "U cenností postupujeme jinak. Pokud najdeme předmět nebo elektroniku, podle které vás dokážeme identifikovat, snažíme se vás kontaktovat i bez toho, abyste se ozvali vy.\n\nZa ztracenou hotovost ani jiné předměty, které si k nám přinášíte, však neneseme odpovědnost.\n\nU ztráty dokladu chceme, aby si jej vyzvedla příslušná osoba (někdo se stejným jménem na dokladu, například rodič). Jinak jsme nuceni doklady odevzdat na příslušný úřad.",
      showFollowUp: true,
      options: [
        {
          id: "lost_valuables_back",
          label: "Zpět na ztráty a nálezy",
          nextNodeId: "lost_found_menu",
        },
        CALL_SUPPORT,
        EMAIL_SUPPORT,
      ],
    },
    lost_pickup_answer: {
      id: "lost_pickup_answer",
      message:
        "Věci vydáváme pouze při osobním vyzvednutí. Individuálně jsme ochotni věc zaslat, ale vyhrazujeme si právo rozhodnout, zda to umožníme. Náklady na odeslání hradíte vy.",
      showFollowUp: true,
      options: [
        {
          id: "lost_pickup_back",
          label: "Zpět na ztráty a nálezy",
          nextNodeId: "lost_found_menu",
        },
        CALL_SUPPORT,
      ],
    },

    /* ── Situace a pomoc ── */
    situations_menu: {
      id: "situations_menu",
      message: "Vyberte situaci, se kterou potřebujete pomoct.",
      options: [
        TO_LOST_FOUND,
        {
          id: "sit_app_access",
          label: "Nejde mi appka / SMS",
          nextNodeId: "app_access_answer",
        },
        {
          id: "sit_entrance",
          label: "Nevidím vchod",
          nextNodeId: "entrance_tip_answer",
        },
        {
          id: "sit_group",
          label: "Dva lidé ve stejný čas",
          nextNodeId: "group_booking_answer",
        },
        {
          id: "sit_access",
          label: "Bezbariérový přístup",
          nextNodeId: "accessibility_answer",
        },
        {
          id: "sit_nerves",
          label: "Nervozita / první barbershop",
          nextNodeId: "nerves_answer",
        },
        {
          id: "sit_more",
          label: "Další situace",
          nextNodeId: "situations_more_menu",
        },
        BACK,
      ],
    },
    situations_more_menu: {
      id: "situations_more_menu",
      message: "Další časté situace. Vyberte, co potřebujete.",
      options: [
        {
          id: "sit_wait",
          label: "Čekám po termínu",
          nextNodeId: "wait_delay_answer",
        },
        {
          id: "sit_filming",
          label: "Natáčení / focení",
          nextNodeId: "filming_consent_answer",
        },
        {
          id: "sit_outage",
          label: "Provozovna nefunguje",
          nextNodeId: "outage_answer",
        },
        {
          id: "sit_scam",
          label: "Podezřelá zpráva / hovor",
          nextNodeId: "scam_check_answer",
        },
        {
          id: "sit_reminder",
          label: "Nepřišla připomínka",
          nextNodeId: "reminder_missing_answer",
        },
        {
          id: "sit_marketing",
          label: "Marketingové souhlasy",
          nextNodeId: "marketing_prefs_answer",
        },
        {
          id: "sit_more2",
          label: "Ještě další",
          nextNodeId: "situations_extra_menu",
        },
        {
          id: "sit_more_back",
          label: "Zpět",
          nextNodeId: "situations_menu",
        },
      ],
    },
    situations_extra_menu: {
      id: "situations_extra_menu",
      message: "Další témata.",
      options: [
        {
          id: "sit_praise",
          label: "Chci pochválit holiče",
          nextNodeId: "praise_barber_answer",
        },
        {
          id: "sit_bug",
          label: "Problém s webem / appkou",
          nextNodeId: "bug_report_answer",
        },
        {
          id: "sit_branch_facilities",
          label: "Parkování, WC, pravidla",
          nextNodeId: "branch_facilities_menu",
        },
        {
          id: "sit_health",
          label: "Nemoc / hygiena",
          nextNodeId: "health_menu",
        },
        {
          id: "sit_behavior",
          label: "Někdo pod vlivem na pobočce",
          nextNodeId: "unsafe_behavior_answer",
        },
        {
          id: "sit_extra_back",
          label: "Zpět",
          nextNodeId: "situations_more_menu",
        },
      ],
    },
    branch_facilities_menu: {
      id: "branch_facilities_menu",
      message: "Co vás k pobočce zajímá?",
      options: [
        {
          id: "bf_parking",
          label: "Parkování / Kudy k nám",
          nextNodeId: "bf_parking_answer",
        },
        {
          id: "bf_amenities",
          label: "WC, Wi-Fi, káva",
          nextNodeId: "bf_amenities_answer",
        },
        {
          id: "bf_pets",
          label: "Pes / kočárek",
          nextNodeId: "bf_pets_answer",
        },
        {
          id: "bf_smoking",
          label: "Kouření / alkohol",
          nextNodeId: "bf_smoking_answer",
        },
        {
          id: "bf_cameras",
          label: "Kamerový systém",
          nextNodeId: "bf_cameras_answer",
        },
        {
          id: "bf_access",
          label: "Bezbariérový přístup",
          nextNodeId: "accessibility_answer",
        },
        {
          id: "bf_back",
          label: "Zpět",
          nextNodeId: "situations_extra_menu",
        },
      ],
    },
    bf_parking_answer: {
      id: "bf_parking_answer",
      message:
        "Preferovaný popis cesty i parkování najdete ve videu Kudy k nám v detailu konkrétní pobočky. Můžete také použít Google Mapy nebo Waze.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_BRANCHES_CATALOG],
    },
    bf_amenities_answer: {
      id: "bf_amenities_answer",
      message:
        "Na pobočkách máme WC, Wi-Fi i občerstvení (voda / káva). V případě potřeby se obraťte na tým holičů nebo Admina pobočky.",
      showFollowUp: true,
      options: [TO_BRANCHES],
    },
    bf_pets_answer: {
      id: "bf_pets_answer",
      message: "Ano, na pobočku smíte se psem i s kočárkem.",
      showFollowUp: true,
      options: [TO_BRANCHES],
    },
    bf_smoking_answer: {
      id: "bf_smoking_answer",
      message:
        "Kouření klasických cigaret a IQOS je v prostorách zakázané. Výjimkou jsou elektronické liquidové cigarety, pokud tím člověk neobtěžuje okolí.",
      showFollowUp: true,
      options: [TO_BRANCHES],
    },
    bf_cameras_answer: {
      id: "bf_cameras_answer",
      message:
        "Každá pobočka má 1-2 bezpečnostní kamery. Záznam se uchovává 5 dní a pak se automaticky maže. Do záznamu se nahlíží jen při problému, odcizení nebo škodě.",
      showFollowUp: true,
      options: [TO_GDPR, TO_BRANCHES],
    },
    health_menu: {
      id: "health_menu",
      message: "Bezpečnost a zdraví. Vyberte téma.",
      options: [
        {
          id: "health_sick",
          label: "Jsem nemocný / COVID",
          nextNodeId: "health_sick_answer",
        },
        {
          id: "health_hygiene",
          label: "Hygiena nástrojů",
          nextNodeId: "health_hygiene_answer",
        },
        {
          id: "health_injury",
          label: "Poranění při holení",
          nextNodeId: "health_injury_answer",
        },
        {
          id: "health_back",
          label: "Zpět",
          nextNodeId: "situations_extra_menu",
        },
      ],
    },
    health_sick_answer: {
      id: "health_sick_answer",
      message:
        "Při vážnější nemoci a riziku nakažení okolí co nejdříve kontaktujte operátora a termín zrušte telefonicky nebo v aplikaci. Jsme lidi a nechceme se navzájem nakazit.",
      showFollowUp: true,
      options: [CALL_SUPPORT, OPEN_BOOKINGS, TO_OPERATOR],
    },
    health_hygiene_answer: {
      id: "health_hygiene_answer",
      message:
        "Každý holič používá na čištění a dezinfekci nástrojů specifický sprej, který nástroje dezinfikuje, čistí, lubrikuje a chladí.",
      showFollowUp: true,
      options: [TO_OPERATOR],
    },
    health_injury_answer: {
      id: "health_injury_answer",
      message:
        "Každá pobočka má zpravidla vlastní lékárničku s obvazy, náplastmi, kamencem a dalším vybavením.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_OPERATOR],
    },
    app_access_answer: {
      id: "app_access_answer",
      message:
        "Pokud vám z jakéhokoliv důvodu nejde přístup do aplikace, obraťte se na IT podporu na čísle +420 774 522 114. Situaci s vámi ihned řeší.\n\nPokud nedorazí potvrzení o naplánované rezervaci, nezoufejte. Je možné, že je vše v pořádku a máme neaktuální údaje, nebo jste je zadali nesprávně.\n\nSprávnost údajů můžete sami zkontrolovat v Profil → Upravit profil, tam uvidíte konkrétní kontakty, které na vás máme. Pokud nesedí (například chcete e-maily na jinou adresu), můžete je sami upravit.\n\nKdyž něco nefunguje, napište nám nebo zavolejte na +420 608 332 881.",
      showFollowUp: true,
      options: [
        CALL_IT_SUPPORT,
        CALL_SUPPORT,
        {
          id: "app_access_profile",
          label: "Upravit profil",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/u/nastaveni/profil",
        },
        TO_BOOKINGS,
        TO_APP,
      ],
    },
    entrance_tip_answer: {
      id: "entrance_tip_answer",
      message:
        "Každá pobočka má video s ukázkou cesty k nám přímo v detailu konkrétní pobočky na webu. Otevřete pobočku a pusťte si navigační video. Můžete také použít Google Mapy nebo Waze.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_BRANCHES_CATALOG, CALL_SUPPORT],
    },
    group_booking_answer: {
      id: "group_booking_answer",
      message:
        "Online se aktuálně objednáte jen po sobě. Pokud se chcete stříhat ve stejný čas u dvou holičů (kamarádi, otec a syn), zavolejte na +420 608 332 881. Operátor vidí kalendáře holičů a pomůže vám to sestavit.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_SLOTS, TO_BOOKINGS],
    },
    accessibility_answer: {
      id: "accessibility_answer",
      message:
        "Každá naše pobočka má bezbariérový přístup. U Kačerova zvolte přístupovou cestu z horní části domu. Video Kudy k nám najdete v detailu pobočky (parkování i MHD).",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_BRANCHES_CATALOG],
    },
    nerves_answer: {
      id: "nerves_answer",
      message:
        "Před návštěvou nového barbershopu nebo při změně účesu je možné, že budete nervózní, a to je naprosto v pořádku.\n\nVěříme, že komunikace je základem dobře odvedené práce a spokojenosti. Pokud máte jakékoliv emoce nebo pocity před návštěvou i během ní, budeme rádi, když se o ně podělíte. Pak dokážeme zajistit ty nejlepší podmínky, aby vše dopadlo v pořádku.\n\nŽádná provozovna ani holič nemá náboženské nebo kulturní privilegium. Navštívit můžete kteroukoliv pobočku.",
      showFollowUp: true,
      options: [
        TO_SLOTS,
        TO_TEAM,
        {
          id: "nerves_first",
          label: "Průvodce první návštěvou",
          nextNodeId: "svc_first_answer",
        },
      ],
    },
    wait_delay_answer: {
      id: "wait_delay_answer",
      message:
        "Pokud jste na provozovně čekali více než 10 minut na svůj předem sjednaný termín, který byl rezervovaný alespoň 2 hodiny předem, dejte nám vědět na +420 608 332 881.\n\nPokud to ověříme, budeme se snažit situaci kompenzovat s ohledem na vzniklé zpoždění.\n\nKdyž má holič zpoždění, můžete nám zavolat nebo napsat. Každá zpětná vazba nám pomáhá služby zlepšovat.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT, TO_OPERATOR],
    },
    filming_consent_answer: {
      id: "filming_consent_answer",
      message:
        "Při natáčení nebo focení jsou na snímcích jen osoby, kterých jsme se předem zeptali na souhlas. Pokud by vám to bylo nepříjemné, dejte nám vědět. Personál ihned přestane s pořizováním záznamu a případně odstraní materiál, na kterém jste zachyceni.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_OPERATOR],
    },
    outage_answer: {
      id: "outage_answer",
      message:
        "Pokud provozovna nebude schopna provozu z technického důvodu, kontaktujeme vás hned po zjištění situace a hledáme řešení.\n\nSnažíme se vyhovět náhradním termínem v plném provozu, na jiné pobočce, u jiného holiče, případně na sjednané pobočce i ve zhoršených podmínkách.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_BOOKINGS, TO_SLOTS],
    },
    scam_check_answer: {
      id: "scam_check_answer",
      message:
        "Naše oficiální firemní číslo je +420 608 332 881. Žádné jiné telefonní číslo není naším oficiálním číslem. Pokud vám někdo volá nebo píše jménem Real Barber z jiného čísla, ověřte to u nás na oficiální lince.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT],
    },
    reminder_missing_answer: {
      id: "reminder_missing_answer",
      message:
        "Chybějící připomínka před termínem běžná není, ale stát se to může. Ozvěte se na +420 608 332 881 a společně vše ověříme a vyřešíme.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_BOOKINGS],
    },
    marketing_prefs_answer: {
      id: "marketing_prefs_answer",
      message:
        "Marketingové souhlasy a komunikační preference nastavíte ve svém profilu: Profil → Nastavení účtu → Komunikační preference.",
      showFollowUp: true,
      options: [
        TO_APP,
        {
          id: "marketing_gdpr",
          label: "Ochrana osobních údajů",
          nextNodeId: "gdpr_answer",
        },
      ],
    },
    praise_barber_answer: {
      id: "praise_barber_answer",
      message:
        "Recenzi konkrétnímu holiči přidáte přímo na jeho detailu. Holiče najdete na stránce Tým, vyberete ze seznamu a dole uvidíte recenze včetně možnosti přidat tu svou.\n\nPřípadně můžete ohodnotit pobočku na webu i na Google Maps. Děkujeme.",
      showFollowUp: true,
      options: [
        {
          id: "praise_team",
          label: "Otevřít tým",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/tym/",
        },
        {
          id: "praise_google",
          label: "Recenze pobočky (Google)",
          nextNodeId: "sat_happy_branch_menu",
        },
        TO_TEAM_CATALOG,
      ],
    },
    bug_report_answer: {
      id: "bug_report_answer",
      message:
        "Za zpětnou vazbu k webu i aplikaci jsme rádi. Ideálně přiložte screenshot nebo záznam obrazovky. Díky tomu problém lépe pochopíme a opravíme.\n\nTechnické problémy s aplikací řeší IT podpora na +420 774 522 114. Obecné dotazy: +420 608 332 881 nebo info@realbarber.cz.",
      showFollowUp: true,
      options: [
        CALL_IT_SUPPORT,
        CALL_SUPPORT,
        EMAIL_SUPPORT,
        {
          id: "bug_email_subject",
          label: "E-mail: problém s appkou",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "mailto:info@realbarber.cz?subject=Problemu%20s%20webu%20nebo%20aplikaci",
        },
      ],
    },
    unsafe_behavior_answer: {
      id: "unsafe_behavior_answer",
      message:
        "Pokud uvidíte, že je nějaký zákazník pod vlivem drog nebo se chová rizikově, oznamte to personálu provozovny, abychom k situaci mohli vhodně přistoupit.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_OPERATOR],
    },

    /* ── Průvodce pro nerozhodnuté ── */
    guide_menu: {
      id: "guide_menu",
      message: "S čím vám pomůžeme? Vyberte situaci, která je vám nejblíž.",
      options: [
        {
          id: "guide_haircut",
          label: "Chci se ostříhat",
          nextNodeId: "guide_haircut_answer",
        },
        {
          id: "guide_booking",
          label: "Potřebuji řešit rezervaci",
          nextNodeId: "guide_booking_answer",
        },
        {
          id: "guide_unhappy",
          label: "Něco se nepovedlo",
          nextNodeId: "guide_unhappy_answer",
        },
        BACK,
      ],
    },
    guide_haircut_answer: {
      id: "guide_haircut_answer",
      message:
        "Skvělé. Podívejte se na populární účesy, volné termíny, nebo na pobočky a tým barberů.",
      showFollowUp: true,
      options: [
        {
          id: "guide_haircuts",
          label: "Populární účesy",
          nextNodeId: "svc_haircuts_menu",
        },
        TO_SLOTS,
        TO_BRANCHES,
        TO_TEAM,
      ],
    },
    guide_booking_answer: {
      id: "guide_booking_answer",
      message:
        "Rezervaci vyřešíte v Moje rezervace. Vyberte, co přesně potřebujete.",
      showFollowUp: true,
      options: [
        {
          id: "guide_booking_advice",
          label: "Problém s rezervací",
          nextNodeId: "bookings_advice_menu",
        },
        TO_BOOKINGS,
        TO_SLOTS,
      ],
    },
    guide_unhappy_answer: {
      id: "guide_unhappy_answer",
      message:
        "Mrzí nás to. Vyberte, co se stalo. U rezervace vám po přihlášení pomůže Moje rezervace.",
      showFollowUp: true,
      options: [
        {
          id: "guide_unhappy_wrong_booking",
          label: "Špatně jsem si zarezervoval termín",
          nextNodeId: "bookings_manage_menu",
        },
        TO_BOOKINGS_MANAGE,
        {
          id: "guide_unhappy_sat",
          label: "Spokojenost / reklamace",
          nextNodeId: "satisfaction_menu",
        },
        TO_LOST_FOUND,
        {
          id: "guide_unhappy_situations",
          label: "Jiná situace",
          nextNodeId: "situations_menu",
        },
        TO_OPERATOR,
        TO_BOOKINGS,
      ],
    },

    /* ── Aplikace ── */
    app_promo: {
      id: "app_promo",
      message:
        "Aplikace Real Barber (RB) je zdarma pro iPhone i Android. Rezervace pod palcem, RB Coiny, kupóny, oblíbení barbeři, čekací listina a historie návštěv. Registrace trvá pár sekund přes telefon a SMS kód.",
      options: [
        {
          id: "app_promo_faq",
          label: "Časté dotazy o aplikaci",
          nextNodeId: "app_faq_menu",
        },
        {
          id: "app_promo_download",
          label: "Stáhnout aplikaci",
          nextNodeId: "app_download_menu",
        },
        {
          id: "app_promo_more",
          label: "Více o aplikaci",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/aplikace-pridejse/",
        },
        BACK,
      ],
    },
    app_faq_menu: {
      id: "app_faq_menu",
      message: "Co vás o aplikaci zajímá? Vyberte téma z FAQ.",
      options: [
        {
          id: "app_faq_basics",
          label: "Základy aplikace",
          nextNodeId: "app_faq_basics_menu",
        },
        {
          id: "app_faq_booking",
          label: "Rezervace v aplikaci",
          nextNodeId: "app_faq_booking_menu",
        },
        {
          id: "app_faq_benefits",
          label: "RB Coiny a výhody",
          nextNodeId: "app_faq_benefits_menu",
        },
        {
          id: "app_faq_features",
          label: "Funkce aplikace",
          nextNodeId: "app_faq_features_menu",
        },
        {
          id: "app_faq_web",
          label: "Celé FAQ na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/aplikace-pridejse/",
        },
        TO_GDPR,
        BACK,
      ],
    },
    app_faq_basics_menu: {
      id: "app_faq_basics_menu",
      message: "Základní informace o aplikaci Real Barber.",
      options: [
        {
          id: "app_faq_what",
          label: "Co je aplikace a pro koho",
          nextNodeId: "app_faq_what_answer",
        },
        {
          id: "app_faq_free",
          label: "Je zdarma? Potřebuji účet?",
          nextNodeId: "app_faq_free_answer",
        },
        {
          id: "app_faq_register",
          label: "Registrace a přihlášení",
          nextNodeId: "app_faq_register_answer",
        },
        {
          id: "app_faq_download",
          label: "Kde aplikaci stáhnu",
          nextNodeId: "app_download_menu",
        },
        BACK_FAQ,
      ],
    },
    app_faq_what_answer: {
      id: "app_faq_what_answer",
      message:
        "Oficiální mobilní aplikace pro klienty Real Barber v Praze. Slouží k rezervaci střihu a dalších služeb, správě návštěv a využití výhod (RB Coiny, kupóny, doporučení). Místo volání nebo psaní zpráv máte termíny, historii a benefity na jednom místě.",
      showFollowUp: true,
      options: [BACK_FAQ, TO_APP],
    },
    app_faq_free_answer: {
      id: "app_faq_free_answer",
      message:
        "Stažení i používání aplikace je zdarma. Pro rezervaci, peněženku RBC, oblíbené, recenze nebo čekací listinu potřebujete bezplatný účet. Registrace probíhá přes telefon a SMS kód, obvykle trvá pár sekund.",
      showFollowUp: true,
      options: [
        {
          id: "app_faq_free_register",
          label: "Jak se zaregistrovat",
          nextNodeId: "app_faq_register_answer",
        },
        BACK_FAQ,
      ],
    },
    app_faq_register_answer: {
      id: "app_faq_register_answer",
      message:
        "Zadejte telefonní číslo a pošleme vám 6místný SMS kód (platí cca 10 minut). Pokud u nás už profil máte, po ověření jste rovnou přihlášeni. Nový klient vyplní jméno, e-mail a volitelně datum narození a fotku. Lze i přihlášení telefonem a heslem.",
      showFollowUp: true,
      options: [
        {
          id: "app_faq_register_login",
          label: "Přihlásit se na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/login",
        },
        BACK_FAQ,
      ],
    },
    app_faq_booking_menu: {
      id: "app_faq_booking_menu",
      message: "Rezervace a správa termínů.",
      options: [
        {
          id: "app_faq_book",
          label: "Jak si rezervuji termín",
          nextNodeId: "app_faq_book_answer",
        },
        {
          id: "app_faq_change",
          label: "Změna nebo zrušení termínu",
          nextNodeId: "app_faq_change_answer",
        },
        {
          id: "app_faq_waitlist",
          label: "Holič nemá volný termín",
          nextNodeId: "waitlist_answer",
        },
        TO_GIFT_VOUCHER,
        BACK_FAQ,
      ],
    },
    app_faq_book_answer: {
      id: "app_faq_book_answer",
      message:
        "V menu zvolíte Vytvořit rezervaci: pobočka, služba, holič (nebo kdokoliv je volný), datum a čas, potvrzení. Přihlášený klient má údaje předvyplněné. Termín lze vybrat i z přehledu Dnes k dispozici nebo z profilu holiče jedním klepnutím.",
      showFollowUp: true,
      options: [TO_SLOTS, TO_APP, BACK_FAQ],
    },
    app_faq_change_answer: {
      id: "app_faq_change_answer",
      message:
        "V Moje rezervace uvidíte nadcházející i minulé návštěvy. U aktivní rezervace můžete přesunout termín: zvolíte nové datum a čas, pobočka, služba i holič zůstávají. Rezervaci lze zrušit (ideálně co nejdříve, bez storno poplatků). Zrušení obvykle nejde méně než 2 hodiny před termínem, přesun ne méně než 1 hodinu před termínem. Po rezervaci si termín můžete přidat do kalendáře v telefonu.",
      showFollowUp: true,
      options: [TO_BOOKINGS_MANAGE, TO_BOOKINGS, BACK_FAQ],
    },
    waitlist_answer: {
      id: "waitlist_answer",
      message:
        "Čekací listina slouží pro situaci, kdy chcete konkrétního holiče v určitý den, ale aktuálně už nemá žádný volný termín.\n\nZapíšete se na čekací listinu a dáte nám vědět, jak vás máme kontaktovat. Pokud se později termín uvolní, například zrušením jiné rezervace, tým Real Barber vás kontaktuje a nabídne vám možnost rezervace.\n\nČekací listina tedy nezaručuje konkrétní termín. Jejím smyslem je dát vám šanci získat termín u vybraného holiče v případě, že se během dne nějaký uvolní.",
      showFollowUp: true,
      options: [TO_TEAM, TO_SLOTS, TO_APP, TO_OPERATOR, TO_BOOKINGS, BACK],
    },
    app_faq_benefits_menu: {
      id: "app_faq_benefits_menu",
      message: "RB Coiny, kupóny a další výhody v aplikaci.",
      options: [
        {
          id: "app_faq_coins",
          label: "Co jsou RB Coiny",
          nextNodeId: "app_faq_coins_answer",
        },
        {
          id: "app_faq_coupons",
          label: "Slevové kupóny a akce",
          nextNodeId: "app_faq_coupons_answer",
        },
        {
          id: "app_faq_referral",
          label: "Doporučení přátel",
          nextNodeId: "app_faq_referral_answer",
        },
        {
          id: "app_faq_why",
          label: "Proč se zapojit teď",
          nextNodeId: "app_faq_why_answer",
        },
        BACK_FAQ,
      ],
    },
    app_faq_coins_answer: {
      id: "app_faq_coins_answer",
      message:
        "RB Coiny (RBC) jsou věrnostní kredity Real Barber. V peněžence vidíte zůstatek a historii. Coiny lze převádět mezi zákazníky a posílat holičům jako dýško. Použijete je u rezervace i nákupů RB STORE. Gift Card z pobočky personál převede obdarovanému na RB Coiny.",
      showFollowUp: true,
      options: [TO_GIFT_VOUCHER, BACK_FAQ],
    },
    app_faq_coupons_answer: {
      id: "app_faq_coupons_answer",
      message:
        "Kupóny najdete nejčastěji v aplikaci, případně na Instagramu @realbarber.jh. U kupónu uvidíte kód, platnost a popis. Při rezervaci zadáte slevový kód a hned uvidíte přepočet ceny.\n\nFyzický dárkový poukaz (Gift Card) do formuláře nezadávejte, přineste ho na návštěvu.",
      showFollowUp: true,
      options: [TO_GIFT_VOUCHER, TO_PROMO, TO_SLOTS, BACK_FAQ],
    },
    app_faq_referral_answer: {
      id: "app_faq_referral_answer",
      message:
        "V peněžence nebo v sekci doporučení uvidíte aktivní referral programy: kolik RBC získáte vy i váš přítel, podmínky a platnost. Appka vygeneruje váš kód a odkaz ke sdílení.",
      showFollowUp: true,
      options: [TO_APP, BACK_FAQ],
    },
    app_faq_why_answer: {
      id: "app_faq_why_answer",
      message:
        "Zapojením hned získáte rychlou rezervaci bez telefonátů, přehled termínů, RB Coiny a cashback, kupóny, čekací listinu u oblíbených holičů a možnost psát recenze. Účet je zdarma, registrace trvá pár sekund.",
      showFollowUp: true,
      options: [
        {
          id: "app_faq_why_download",
          label: "Stáhnout aplikaci",
          nextNodeId: "app_download_menu",
        },
        BACK_FAQ,
      ],
    },
    app_faq_features_menu: {
      id: "app_faq_features_menu",
      message: "Další funkce aplikace Real Barber.",
      options: [
        {
          id: "app_faq_nearby",
          label: "Co je Blízko mě",
          nextNodeId: "app_faq_nearby_answer",
        },
        {
          id: "app_faq_favorites",
          label: "Oblíbené pobočky a holiči",
          nextNodeId: "app_faq_favorites_answer",
        },
        {
          id: "app_faq_mystyle",
          label: "Co je Můj styl",
          nextNodeId: "app_faq_mystyle_answer",
        },
        {
          id: "app_faq_push",
          label: "Push notifikace",
          nextNodeId: "app_faq_push_answer",
        },
        BACK_FAQ,
      ],
    },
    app_faq_nearby_answer: {
      id: "app_faq_nearby_answer",
      message:
        "Funkce využije polohu telefonu a ukáže nejbližší pobočku: vzdálenost, orientační dobu cesty autem a nejbližší volné termíny. Odtud lze otevřít navigaci (Google Maps nebo Waze) nebo pokračovat k rezervaci. Pobočky: Modřany, Kačerov, Hagibor, Barrandov.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_SLOTS, BACK_FAQ],
    },
    app_faq_favorites_answer: {
      id: "app_faq_favorites_answer",
      message:
        "U pobočky, barbera, služby nebo průvodce klepněte na srdce a entita se uloží do Oblíbených. Oblíbení holiči se zobrazují i v přehledu týmu v sekci Dnes dostupní oblíbení.",
      showFollowUp: true,
      options: [TO_TEAM, BACK_FAQ],
    },
    app_faq_mystyle_answer: {
      id: "app_faq_mystyle_answer",
      message:
        "Můj styl je sekce, kde si můžete nakonfigurovat minulé účesy a jejich varianty pro budoucí návštěvy nebo změnu holiče.",
      showFollowUp: true,
      options: [TO_APP, BACK_FAQ],
    },
    app_faq_push_answer: {
      id: "app_faq_push_answer",
      message:
        "V Profilu vpravo nahoře je ikona zvonku. Zelená fajfka = push notifikace máte povolené. Červený křížek = jsou vypnuté: klepněte na zvonek a povolte je. Po správném nastavení uvidíte zelenou fajfku.\n\nAppka pak hlásí stav rezervace, připomínky, výzvy k recenzi nebo pohyby v peněžence RBC.",
      showFollowUp: true,
      options: [TO_BOOKINGS, BACK_FAQ],
    },

    /* ── API nodes ── */
    api_slots: {
      id: "api_slots",
      message: "Načítám nejbližší termíny…",
      apiHandler: "slots",
      showFollowUp: true,
      options: [TO_WAITLIST, TO_BRANCHES, TO_BOOKINGS, TO_APP],
    },
    api_team: {
      id: "api_team",
      message: "Načítám, kdo dnes pracuje…",
      apiHandler: "todayTeam",
      showFollowUp: true,
      options: [
        TO_WAITLIST,
        TO_SLOTS,
        TO_BRANCHES,
        TO_TEAM_CATALOG,
        {
          id: "team_link",
          label: "Tým na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/tym/",
        },
      ],
    },
    api_branches: {
      id: "api_branches",
      message: "Naše pobočky v Praze:",
      apiHandler: "branches",
      showFollowUp: true,
      options: [TO_BRANCHES_CATALOG, TO_SLOTS, TO_TEAM, TO_HOURS],
    },
    api_promo: {
      id: "api_promo",
      message: "Načítám aktuální akce a kupóny…",
      apiHandler: "promo",
      showFollowUp: true,
      options: [
        TO_COUPON_ISSUE,
        TO_SLOTS,
        TO_BOOKINGS,
        TO_GIFT_VOUCHER,
        TO_BRANCHES,
        BACK,
      ],
    },

    /* ── Moje rezervace ── */
    bookings_manage_menu: {
      id: "bookings_manage_menu",
      message: "Co s rezervací potřebujete vyřešit?",
      showFollowUp: true,
      options: [
        {
          id: "bm_open",
          label: "Otevřít moje rezervace",
          nextNodeId: "bookings_open_confirm",
          action: "openReservations",
        },
        {
          id: "bm_move",
          label: "Přesunout termín",
          nextNodeId: "ba_move_answer",
        },
        {
          id: "bm_cancel",
          label: "Zrušit rezervaci",
          nextNodeId: "ba_cancel_answer",
        },
        {
          id: "bm_change",
          label: "Jiný holič nebo pobočka",
          nextNodeId: "ba_change_answer",
        },
        {
          id: "bm_status",
          label: "Nevidím rezervaci / stav",
          nextNodeId: "ba_status_answer",
        },
        {
          id: "bm_no_confirm",
          label: "Nepřišlo potvrzení",
          nextNodeId: "ba_no_confirm_answer",
        },
        {
          id: "bm_late",
          label: "Mám zpoždění",
          nextNodeId: "ba_late_answer",
        },
        TO_BA_SHARE,
        TO_BA_SHARE_RECIPIENT,
      ],
    },
    bookings_menu: {
      id: "bookings_menu",
      message:
        "Po přihlášení najdete své termíny v Moje rezervace. Termín můžete přesunout, zrušit nebo sdílet s někým jiným.",
      messageLoggedIn:
        "Své termíny najdete v Moje rezervace. Termín můžete přesunout, zrušit nebo sdílet s někým jiným.",
      showFollowUp: true,
      options: [
        {
          id: "bookings_open",
          label: "Otevřít moje rezervace",
          nextNodeId: "bookings_open_confirm",
          action: "openReservations",
        },
        TO_SLOTS,
        {
          id: "bookings_advice",
          label: "Obecná rada k rezervaci",
          nextNodeId: "bookings_advice_menu",
        },
        TO_BOOKINGS_MANAGE,
        {
          id: "bookings_no_confirm",
          label: "Nepřišlo potvrzení",
          nextNodeId: "ba_no_confirm_answer",
        },
        {
          id: "bookings_last_visit_auth",
          label: "Poslední návštěva",
          nextNodeId: "last_visit",
          requiresAuth: true,
        },
        {
          id: "bookings_last_visit_guest",
          label: "Poslední návštěva",
          nextNodeId: "last_visit_guest",
          requiresGuest: true,
        },
      ],
    },
    bookings_open_confirm: {
      id: "bookings_open_confirm",
      message:
        "Otevřel jsem vám Moje rezervace.",
      showFollowUp: true,
    },
    bookings_advice_menu: {
      id: "bookings_advice_menu",
      message: "Co přesně ohledně rezervace budeme řešit?",
      options: [
        {
          id: "ba_status",
          label: "Stav rezervace",
          nextNodeId: "ba_status_answer",
        },
        {
          id: "ba_cancel",
          label: "Zrušení rezervace",
          nextNodeId: "ba_cancel_answer",
        },
        {
          id: "ba_move",
          label: "Přesunutí termínu",
          nextNodeId: "ba_move_answer",
        },
        {
          id: "ba_late",
          label: "Mám zpoždění / přijdu dřív",
          nextNodeId: "ba_late_answer",
        },
        {
          id: "ba_book",
          label: "Chci se objednat",
          nextNodeId: "ba_book_answer",
        },
        {
          id: "ba_more",
          label: "Další situace",
          nextNodeId: "bookings_advice_more",
        },
        BACK,
      ],
    },
    bookings_advice_more: {
      id: "bookings_advice_more",
      message: "Další situace u rezervace.",
      options: [
        {
          id: "ba_no_confirm",
          label: "Nepřišlo potvrzení",
          nextNodeId: "ba_no_confirm_answer",
        },
        {
          id: "ba_change",
          label: "Změna barbera / pobočky",
          nextNodeId: "ba_change_answer",
        },
        {
          id: "ba_wrong_data",
          label: "Špatné jméno / telefon",
          nextNodeId: "ba_wrong_data_answer",
        },
        {
          id: "ba_sick_barber",
          label: "Holič onemocněl / směna odpadla",
          nextNodeId: "ba_sick_barber_answer",
        },
        {
          id: "ba_waitlist",
          label: "Holič nemá volný termín",
          nextNodeId: "waitlist_answer",
        },
        TO_BA_SHARE,
        {
          id: "ba_more_back",
          label: "Zpět",
          nextNodeId: "bookings_advice_menu",
        },
      ],
    },
    ba_wrong_data_answer: {
      id: "ba_wrong_data_answer",
      message:
        "Rezervaci omylem na špatné jméno nebo telefon ideálně vyřešte s operátorem na +420 608 332 881. Operátor údaje v rezervaci změní.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_OPERATOR, OPEN_BOOKINGS],
    },
    ba_sick_barber_answer: {
      id: "ba_sick_barber_answer",
      message:
        "Když holič onemocní nebo směna odpadne, budeme se snažit najít náhradní řešení, které vám nejvíc vyhovuje: změna holiče, nebo změna termínu.",
      showFollowUp: true,
      options: [CALL_SUPPORT, TO_SLOTS, TO_TEAM, TO_OPERATOR],
    },
    ba_status_answer: {
      id: "ba_status_answer",
      message:
        "Stav rezervace najdete po přihlášení v Moje rezervace. Otevřete termín v detailu: uvidíte číslo, cenu, holiče, navigaci na pobočku a stav (nadcházející, probíhá, minulé, zrušeno).\n\nTermín nevidíte? Napište na info@realbarber.cz nebo volejte +420 608 332 881.",
      showFollowUp: true,
      options: [OPEN_BOOKINGS, TO_BA_SHARE, TO_OPERATOR],
    },
    ba_no_confirm_answer: {
      id: "ba_no_confirm_answer",
      message:
        "Potvrzení rezervace chodí na e-mail, který jste zadali při objednávce. Samotná rezervace je ale uložená v účtu.\n\nPřihlaste se telefonním číslem, které jste při rezervaci zadali. V Moje rezervace uvidíte svůj termín stejně jako u ostatních rezervací.\n\nSprávnost údajů můžete sami zkontrolovat v Profil → Upravit profil, tam uvidíte konkrétní kontakty, které na vás máme. Pokud nesedí (například chcete e-maily na jinou adresu), můžete je sami upravit.\n\nKdyž se nepřihlásíte nebo něco nefunguje, volejte +420 608 332 881.",
      showFollowUp: true,
      options: [
        OPEN_BOOKINGS,
        {
          id: "ba_no_confirm_profile",
          label: "Upravit profil",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/u/nastaveni/profil",
        },
        {
          id: "ba_no_confirm_login",
          label: "Přihlásit se",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/login",
        },
        {
          id: "ba_no_confirm_call",
          label: "Zavolat",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "tel:+420608332881",
        },
        TO_OPERATOR,
      ],
    },
    ba_cancel_answer: {
      id: "ba_cancel_answer",
      message:
        "Rezervaci zrušíte v detailu termínu tlačítkem Zrušit. Zrušením uvolníte místo pro ostatní. Storno poplatky neúčtujeme, prosíme ale o co nejvčasnější info (ideálně alespoň 2 dny předem). Online zrušení obvykle nejde méně než 2 hodiny před domluveným termínem.\n\nNestíháte to online? Volejte +420 608 332 881.",
      showFollowUp: true,
      options: [OPEN_BOOKINGS, TO_BA_SHARE, TO_OPERATOR],
    },
    ba_move_answer: {
      id: "ba_move_answer",
      message:
        "Termín přesunete v detailu rezervace tlačítkem Přesunout. Pobočka, služba i holič zůstávají, mění se jen datum a čas.\n\nNestíháte to online? Volejte +420 608 332 881.",
      showFollowUp: true,
      options: [OPEN_BOOKINGS, TO_SLOTS, TO_BA_SHARE, TO_OPERATOR],
    },
    ba_share_answer: {
      id: "ba_share_answer",
      message:
        "Odesláním odkazu můžete komukoliv sdílet termín, holiče a pobočku. Ve sdíleném odkazu nejsou vaše jméno, cena rezervace ani kontaktní údaje.\n\nV detailu rezervace u termínu zvolte Sdílet detail rezervace. Sdílet lze u nadcházejících a právě probíhajících termínů, ne u minulých ani zrušených.",
      showFollowUp: true,
      options: [OPEN_BOOKINGS, TO_BA_SHARE_RECIPIENT, TO_OPERATOR],
    },
    ba_share_recipient_answer: {
      id: "ba_share_recipient_answer",
      message:
        "Příjemce otevře váš odkaz (bez přihlášení).\n\nUvidí:\n- stav termínu (naplánováno, probíhá, dokončeno nebo zrušeno)\n- jméno holiče a fotku\n- pobočku, adresu a navigaci (Mapy / Waze)\n- datum a čas od-do\n- tlačítko Přidat do kalendáře\n\nNeuvidí vaše jméno, cenu rezervace ani kontaktní údaje.\n\nPo skončení návštěvy nebo po zrušení odkaz přestane fungovat.",
      showFollowUp: true,
      options: [TO_BA_SHARE, OPEN_BOOKINGS, TO_OPERATOR],
    },
    ba_change_answer: {
      id: "ba_change_answer",
      message:
        "Přesunutí termínu nemění holiče ani pobočku. Chcete-li jiného barbera nebo jinou pobočku (Modřany, Kačerov, Hagibor, Barrandov), zrušte stávající rezervaci a vytvořte novou.\n\nRádi pomůžeme s výběrem na +420 608 332 881.",
      showFollowUp: true,
      options: [OPEN_BOOKINGS, TO_SLOTS, TO_BRANCHES, TO_OPERATOR],
    },
    ba_late_answer: {
      id: "ba_late_answer",
      message:
        "Zpoždění do 5 minut obvykle není problém. Při delším zpoždění zavolejte operátorovi na +420 608 332 881. Pomůže podle aktuálních možností (zkrácení, přesun, jiné řešení).\n\nPřijdete-li dřív, záleží na vytíženosti. Pokud holič dostříhal dříve, může vás vzít dříve.",
      showFollowUp: true,
      options: [
        {
          id: "ba_late_call",
          label: "Zavolat +420 608 332 881",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "tel:+420608332881",
        },
        {
          id: "ba_late_move",
          label: "Přesunout termín",
          nextNodeId: "ba_move_answer",
        },
        TO_OPERATOR,
      ],
    },
    ba_book_answer: {
      id: "ba_book_answer",
      message:
        "Novou rezervaci vytvoříte u volných termínů nebo telefonicky (+420 608 332 881). Ideálně alespoň 3 dny dopředu. Otevřeno každý den včetně svátků. Po-Pá 9-21, So-Ne 10-18.\n\nDva lidé ve stejný čas: volejte operátora, který vidí kalendáře holičů. Opakovanou rezervaci (např. každé 4 týdny) nastavíte po domluvě s konkrétním holičem.",
      showFollowUp: true,
      options: [
        TO_SLOTS,
        {
          id: "ba_book_link",
          label: "Nová rezervace",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/rezervace",
        },
        CALL_SUPPORT,
        TO_APP,
      ],
    },

    /* ── Poslední návštěva ── */
    last_visit: {
      id: "last_visit",
      message:
        "Poslední návštěvu zobrazíme po načtení dat z vašeho účtu. Brzy ji uvidíte přímo zde v chatu.",
      requiresAuth: true,
      showFollowUp: true,
      options: [TO_SLOTS, TO_BOOKINGS],
    },
    last_visit_guest: {
      id: "last_visit_guest",
      message:
        "Poslední návštěvu uvidíte po přihlášení. Přihlaste se pro rychlejší správu rezervací a historii návštěv.",
      showFollowUp: true,
      options: [
        {
          id: "last_visit_login",
          label: "Přihlásit se",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/login",
        },
        TO_SLOTS,
      ],
    },

    /* ── Spokojenost ── */
    satisfaction_menu: {
      id: "satisfaction_menu",
      message: "S čím přesně Vám mohu pomoct ohledně spokojenosti?",
      options: [
        {
          id: "sat_happy",
          label: "Byl jsem spokojený",
          nextNodeId: "sat_happy_intro",
        },
        {
          id: "sat_result",
          label: "Nejsem spokojený s výsledkem",
          nextNodeId: "sat_result_answer",
        },
        {
          id: "sat_complaint",
          label: "Stížnost na pobočku / barbera",
          nextNodeId: "sat_complaint_answer",
        },
        {
          id: "sat_wait",
          label: "Čekám po termínu",
          nextNodeId: "wait_delay_answer",
        },
        {
          id: "sat_praise",
          label: "Chci pochválit holiče",
          nextNodeId: "praise_barber_answer",
        },
        {
          id: "sat_other",
          label: "Jiný problém",
          nextNodeId: "sat_other_answer",
        },
        BACK,
      ],
    },
    sat_happy_intro: {
      id: "sat_happy_intro",
      message:
        "To nás moc těší! Rádi bychom vás požádali o recenzi. Byli jste spokojeni spíš na pobočce, nebo u konkrétního holiče?",
      options: [
        {
          id: "sat_happy_barber",
          label: "U konkrétního holiče",
          nextNodeId: "sat_happy_barber_answer",
        },
        {
          id: "sat_happy_branch",
          label: "Na pobočce (Google recenze)",
          nextNodeId: "sat_happy_branch_menu",
        },
        {
          id: "sat_happy_back",
          label: "Zpět",
          nextNodeId: "satisfaction_menu",
        },
      ],
    },
    sat_happy_barber_answer: {
      id: "sat_happy_barber_answer",
      message:
        "Na stránce týmu si vyberte holiče a otevřete jeho profil. Po přihlášení u profilu můžete napsat recenzi a ohodnotit návštěvu.\n\nChcete poděkovat celé pobočce? Napište recenzi na Google. Odkaz podle pobočky najdete níže.",
      options: [
        {
          id: "sat_happy_team",
          label: "Celý tým",
          nextNodeId: "sat_happy_team_confirm",
          action: "openUrl",
          url: "/tym",
        },
        {
          id: "sat_happy_google_from_barber",
          label: "Recenze na Google",
          nextNodeId: "sat_happy_branch_menu",
        },
        {
          id: "sat_happy_barber_back",
          label: "Zpět",
          nextNodeId: "sat_happy_intro",
        },
      ],
    },
    sat_happy_team_confirm: {
      id: "sat_happy_team_confirm",
      message:
        "Otevřel jsem stránku týmu. Klikněte na holiče, profil a po přihlášení tam můžete recenzi doplnit.",
      showFollowUp: true,
      options: [
        {
          id: "sat_happy_team_google",
          label: "Recenze na Google",
          nextNodeId: "sat_happy_branch_menu",
        },
        TO_PROMO,
      ],
    },
    sat_happy_branch_menu: {
      id: "sat_happy_branch_menu",
      message:
        "Děkujeme! Vyberte pobočku a napište recenzi na Google. Pomůže to ostatním zákazníkům i našemu týmu.",
      options: [
        ...SAT_HAPPY_GOOGLE_REVIEW_OPTIONS,
        {
          id: "sat_happy_branch_back",
          label: "Zpět",
          nextNodeId: "sat_happy_intro",
        },
      ],
    },
    sat_happy_review_thanks: {
      id: "sat_happy_review_thanks",
      message:
        "Děkujeme za recenzi! Moc nám pomáhá. Kdykoli se ozvěte, Rbíček je tu pro vás.",
      options: GOODBYE_FOLLOWUP,
    },
    sat_result_answer: {
      id: "sat_result_answer",
      message:
        "Garantujeme spokojenost. Při vážnějším problému zákazník za službu neplatí.\n\nReklamace druhý den dává větší šanci problém najít a vyřešit. Po týdnu už účes vypadá jinak, protože vlasy narostou.\n\nFeedback bez reklamace: SMS na +420 608 332 881.",
      showFollowUp: true,
      options: [TO_OPERATOR, CALL_SUPPORT, TO_BOOKINGS],
    },
    sat_complaint_answer: {
      id: "sat_complaint_answer",
      message:
        "Napište datum a čas, jméno, pobočku, službu a co se stalo. Ozvěte se na +420 608 332 881 (hovor / SMS) nebo info@realbarber.cz. Preferované pořadí kanálů: hovor, SMS, WhatsApp, Telegram.",
      showFollowUp: true,
      options: [TO_OPERATOR, CALL_SUPPORT, EMAIL_SUPPORT],
    },
    sat_other_answer: {
      id: "sat_other_answer",
      message:
        "Popište prosím problém vlastními slovy, nebo vyberte situaci níže. Můžete nás také kontaktovat na +420 608 332 881.",
      showFollowUp: true,
      options: [
        TO_LOST_FOUND,
        {
          id: "sat_other_situations",
          label: "Situace a pomoc",
          nextNodeId: "situations_menu",
        },
        TO_OPERATOR,
        CALL_SUPPORT,
      ],
    },

    /* ── RB Coiny & aplikace ── */
    app_menu: {
      id: "app_menu",
      message: "Co vás zajímá ohledně RB Coinů a aplikace?",
      options: [
        {
          id: "app_menu_faq",
          label: "Časté dotazy o aplikaci",
          nextNodeId: "app_faq_menu",
        },
        TO_APP,
        {
          id: "app_coins",
          label: "Co jsou RB Coiny",
          nextNodeId: "app_faq_coins_answer",
        },
        {
          id: "app_topup",
          label: "Dárkový poukaz / Gift Card",
          nextNodeId: "gift_voucher_answer",
        },
        {
          id: "app_download",
          label: "Stáhnout aplikaci",
          nextNodeId: "app_download_menu",
        },
        {
          id: "app_account",
          label: "Účet a historie",
          nextNodeId: "app_account_answer",
        },
        BACK,
      ],
    },
    app_download_menu: {
      id: "app_download_menu",
      message:
        "Appku Real Barber najdete v App Store (iPhone) a Google Play (Android). Na webu je i stránka ke stažení s QR kódem.",
      options: [
        {
          id: "app_ios",
          label: "App Store (iPhone)",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "https://apps.apple.com/app/real-barber/id6474383720",
        },
        {
          id: "app_android",
          label: "Google Play (Android)",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "https://play.google.com/store/apps/details?id=cz.realbarber.app",
        },
        {
          id: "app_download_web",
          label: "Stránka ke stažení",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/aplikace-pridejse/",
        },
        BACK_FAQ,
      ],
    },
    app_coins_answer: {
      id: "app_coins_answer",
      message:
        "RB Coiny jsou věrnostní kredity v peněžence Real Barber. Platíte jimi za služby i produkty RB STORE. Gift Card z pobočky personál převede obdarovanému na Coiny v účtu.",
      showFollowUp: true,
      options: [
        {
          id: "app_coins_faq",
          label: "Více o RB Coiny",
          nextNodeId: "app_faq_coins_answer",
        },
        TO_GIFT_VOUCHER,
        TO_APP,
      ],
    },
    gift_voucher_answer: {
      id: "gift_voucher_answer",
      message:
        "Dárkový poukaz (Gift Card) koupíte na všech pobočkách. Nemá omezenou platnost a platí na všechny služby na všech pobočkách.\n\nKredit na místě převedeme obdarovanému na RB Coiny. Voucher lze rozdělit i mezi více lidí. Coiny jdou použít na služby i RB STORE.\n\nPři online rezervaci fyzickou kartu do formuláře nezadávejte. Přineste ji na pobočku a uplatníme ji při návštěvě.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_APP, TO_BOOKINGS, BACK],
    },
    app_account_answer: {
      id: "app_account_answer",
      message:
        "Stejný účet funguje na webu i v aplikaci: historie, oblíbení, peněženka. Historii návštěv uchováváme bez časového omezení.\n\nZměnu telefonu u účtu provede operátor ručně na +420 608 332 881.",
      showFollowUp: true,
      options: [
        TO_APP,
        TO_BOOKINGS,
        CALL_SUPPORT,
        {
          id: "app_account_delete",
          label: "Smazání účtu / GDPR",
          nextNodeId: "gdpr_delete_answer",
        },
      ],
    },

    /* ── Služby, ceník ── */
    services_menu: {
      id: "services_menu",
      message: "Jaké informace o službách hledáte?",
      options: [
        {
          id: "svc_price",
          label: "Ceník",
          nextNodeId: "svc_price_answer",
        },
        {
          id: "svc_list",
          label: "Jaké máte služby",
          nextNodeId: "svc_list_answer",
        },
        {
          id: "svc_duration",
          label: "Jak dlouho trvá služba",
          nextNodeId: "svc_duration_answer",
        },
        {
          id: "svc_haircuts",
          label: "Katalog účesů",
          nextNodeId: "svc_haircuts_menu",
        },
        {
          id: "svc_barber",
          label: "Jak vybrat barbera",
          nextNodeId: "svc_barber_answer",
        },
        {
          id: "svc_first",
          label: "První návštěva",
          nextNodeId: "svc_first_answer",
        },
        {
          id: "svc_result_care",
          label: "Výsledek, péče, alergie",
          nextNodeId: "svc_result_menu",
        },
        BACK,
      ],
    },
    svc_result_menu: {
      id: "svc_result_menu",
      message: "Vyberte téma k výsledku služby.",
      options: [
        {
          id: "svc_unknown_cut",
          label: "Nevím, jaký střih chci",
          nextNodeId: "svc_unknown_cut_answer",
        },
        {
          id: "svc_beard",
          label: "Vousy / holení",
          nextNodeId: "svc_beard_answer",
        },
        {
          id: "svc_color",
          label: "Barvení a produkty",
          nextNodeId: "svc_color_answer",
        },
        {
          id: "svc_same_day_fix",
          label: "Výsledek nesedí (ten den)",
          nextNodeId: "svc_same_day_fix_answer",
        },
        {
          id: "svc_home_care",
          label: "Péče doma po střihu",
          nextNodeId: "svc_home_care_answer",
        },
        {
          id: "svc_allergy",
          label: "Alergie / citlivá pokožka",
          nextNodeId: "svc_allergy_answer",
        },
        {
          id: "svc_photos",
          label: "Fotky před / po",
          nextNodeId: "svc_photos_answer",
        },
        {
          id: "svc_result_back",
          label: "Zpět",
          nextNodeId: "services_menu",
        },
      ],
    },
    svc_unknown_cut_answer: {
      id: "svc_unknown_cut_answer",
      message:
        "Holič vám na místě doporučí a navrhne možnosti, které jsou aktuálně možné. Klidně přineste fotku inspirace, ale poradí i bez ní.",
      showFollowUp: true,
      options: [TO_SLOTS, TO_TEAM_CATALOG],
    },
    svc_beard_answer: {
      id: "svc_beard_answer",
      message:
        "Děláme úpravu vousů i jejich holení za pomoci napaření horkou párou.",
      showFollowUp: true,
      options: [
        TO_SLOTS,
        {
          id: "svc_beard_price",
          label: "Ceník",
          nextNodeId: "svc_price_answer",
        },
      ],
    },
    svc_color_answer: {
      id: "svc_color_answer",
      message:
        "Nabízíme barvení i styling vlasů pomocí stylingových produktů. Stylingové produkty si můžete na místě také koupit.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_SLOTS],
    },
    svc_same_day_fix_answer: {
      id: "svc_same_day_fix_answer",
      message:
        "Záleží hlavně na konzultaci na začátku. Při jakýchkoliv nejasnostech se doptávejte hned před zahájením služby. Není trapné se ujistit otázkou. Cíl je, aby holič i vy stejně chápali požadovaný výsledek.",
      showFollowUp: true,
      options: [
        {
          id: "svc_same_day_sat",
          label: "Spokojenost / reklamace",
          nextNodeId: "satisfaction_menu",
        },
        TO_OPERATOR,
      ],
    },
    svc_home_care_answer: {
      id: "svc_home_care_answer",
      message:
        "Na péči doma se zeptejte svého holiče. Individuálně vám poradí, co a jak dělat (mytí, produkt, frekvence návštěv).",
      showFollowUp: true,
      options: [TO_TEAM, TO_SLOTS],
    },
    svc_allergy_answer: {
      id: "svc_allergy_answer",
      message:
        "Máte-li předchozí negativní zkušenosti (například podráždění po holení břitvou), řekněte to holiči ještě před zahájením služby.",
      showFollowUp: true,
      options: [TO_OPERATOR, TO_SLOTS],
    },
    svc_photos_answer: {
      id: "svc_photos_answer",
      message:
        "Holič se vždy zeptá, zda s focením souhlasíte. Případně může na fotce zakrýt obličej. Když nesouhlasíte, fotky před a po nepořídí a rozhodnutí respektuje.",
      showFollowUp: true,
      options: [TO_OPERATOR],
    },
    svc_price_answer: {
      id: "svc_price_answer",
      message:
        "Aktuální ceník najdete na webu, v aplikaci a před dokončením rezervace. Ceny jsou na všech pobočkách stejné. Platba hotově i kartou, bez skrytých doplatků.",
      showFollowUp: true,
      options: [
        {
          id: "svc_price_link",
          label: "Otevřít ceník",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/cenik",
        },
        TO_SLOTS,
        TO_PROMO,
      ],
    },
    svc_list_answer: {
      id: "svc_list_answer",
      message:
        "Nabízíme stříhání vlasů, rychlé stříhání, úpravu vousů, holení s napařením, dětské stříhání, barvení a styling. Ženy stříháme také se zaměřením na pánské účesy. Detaily délek služeb najdete u položky Jak dlouho trvá služba.",
      showFollowUp: true,
      options: [
        {
          id: "svc_list_duration",
          label: "Jak dlouho trvá služba",
          nextNodeId: "svc_duration_answer",
        },
        {
          id: "svc_list_link",
          label: "Přehled služeb",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/sluzby",
        },
      ],
    },
    svc_barber_answer: {
      id: "svc_barber_answer",
      message:
        "Každý holič má na webu profil s fotkou a popisem práce. Vyberte podle stylu, jazyků a dostupnosti. Nemá-li váš holič volno, pokusíme se najít vhodnou dočasnou náhradu.\n\nU juniorů / trainee je zákazník vždy předem informován (online i telefonicky).",
      showFollowUp: true,
      options: [
        TO_TEAM,
        TO_TEAM_CATALOG,
        TO_SLOTS,
        {
          id: "svc_barber_link",
          label: "Tým na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/tym/",
        },
      ],
    },
    svc_hours_answer: {
      id: "svc_hours_answer",
      message:
        "Otevřeno každý den včetně svátků podle běžné otevírací doby. Po-Pá 9-21, So-Ne 10-18. Všechny pobočky stejně. Mimořádné uzavření hlásíme na sociálních sítích a webu. Kontakt: +420 608 332 881, info@realbarber.cz.",
      showFollowUp: true,
      options: [TO_BRANCHES_CATALOG, TO_BRANCHES, TO_TEAM, TO_SLOTS],
    },
    svc_first_answer: {
      id: "svc_first_answer",
      message:
        "Ideálně se objednejte alespoň 3 dny dopředu. S vysokou pravděpodobností si pak vyberete ideální termín. Někdy to jde i ten samý den (klidně 2 hodiny předem), jindy až za 1-2 dny. Záleží na vytíženosti holiče.\n\nStačí dorazit 5-10 minut před termínem, nebo přímo na čas. S sebou nic nutného nepotřebujete. Maximálně telefon s fotkou minulého účesu nebo inspirací.\n\nPrůběh: příchod → konzultace (5-10 min, v ceně služby) → služba → shrnutí a tipy k údržbě → platba → odchod.",
      showFollowUp: true,
      options: [
        {
          id: "svc_first_more",
          label: "Další tipy k první návštěvě",
          nextNodeId: "first_visit_menu",
        },
        TO_SLOTS,
        TO_TEAM,
        TO_BRANCHES,
        {
          id: "svc_first_nerves",
          label: "Nervozita / první barbershop",
          nextNodeId: "nerves_answer",
        },
        {
          id: "svc_first_link",
          label: "Průvodce na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/prvni-navsteva-barbershopu/",
        },
        TO_OPERATOR,
      ],
    },
    first_visit_menu: {
      id: "first_visit_menu",
      message: "Co vás k první návštěvě zajímá?",
      options: [
        {
          id: "fv_walkin",
          label: "Bez rezervace (walk-in)",
          nextNodeId: "fv_walkin_answer",
        },
        {
          id: "fv_kids",
          label: "Děti / věk",
          nextNodeId: "fv_kids_answer",
        },
        {
          id: "fv_women",
          label: "Ženy / dlouhé vlasy",
          nextNodeId: "fv_women_answer",
        },
        {
          id: "fv_companion",
          label: "Doprovod / čekárna",
          nextNodeId: "fv_companion_answer",
        },
        {
          id: "fv_languages",
          label: "Jazyky obsluhy",
          nextNodeId: "fv_languages_answer",
        },
        {
          id: "fv_duration",
          label: "Jak dlouho trvá služba",
          nextNodeId: "svc_duration_answer",
        },
        {
          id: "fv_back_first",
          label: "Zpět",
          nextNodeId: "svc_first_answer",
        },
      ],
    },
    fv_walkin_answer: {
      id: "fv_walkin_answer",
      message:
        "Walk-in bez rezervace je možný, ale objednaní zákazníci mají vždy přednost. Ve slabších dnech, pokud je holič volný, může vzít zákazníka z ulice. Před začátkem služby si ale musí rezervaci zadat do systému.",
      showFollowUp: true,
      options: [TO_SLOTS, TO_TEAM, CALL_SUPPORT],
    },
    fv_kids_answer: {
      id: "fv_kids_answer",
      message:
        "Stříháme děti v jakémkoliv věku, pokud už mají se stříháním zkušenost a zvládnou ho. Některé děti to zvládnou ve 2 letech, jiné ne ve 4 letech.\n\nDo 12 let je lepší doprovod rodiče. Děti, které k nám chodí pravidelně a jsou zvyklé, mohou přijít i bez rodiče.",
      showFollowUp: true,
      options: [TO_SLOTS, TO_OPERATOR],
    },
    fv_women_answer: {
      id: "fv_women_answer",
      message:
        "Ženy stříháme také, ale zaměřujeme se na pánské účesy. Lepší je nejdřív konzultace na pobočce s holiči, kteří se specializují na delší vlasy, a objednat se ke konkrétnímu holiči. Zákaz vstupu žen u nás neplatí.",
      showFollowUp: true,
      options: [TO_TEAM_CATALOG, TO_SLOTS, TO_BRANCHES],
    },
    fv_companion_answer: {
      id: "fv_companion_answer",
      message:
        "S doprovodem přijít můžete. Každá pobočka má kapacitu zhruba pro 2-5 čekajících. V čekárně můžou být i objednaní zákazníci, takže není ideální brát s sebou celou rodinu.",
      showFollowUp: true,
      options: [TO_BRANCHES, TO_SLOTS],
    },
    fv_languages_answer: {
      id: "fv_languages_answer",
      message:
        "Jazyky jednotlivých holičů najdete na webu u jejich profilu. Někdo mluví anglicky, někdo ukrajinsky, někdo jen česky. Pokud je to možné, s konzultací v jiném jazyce může pomoct i jiný holič.",
      showFollowUp: true,
      options: [
        TO_TEAM_CATALOG,
        {
          id: "fv_languages_web",
          label: "Tým na webu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/tym/",
        },
      ],
    },
    svc_duration_answer: {
      id: "svc_duration_answer",
      message:
        "Klasický střih vlasů: 45 minut.\nRychlé stříhání (bez mytí): 30 minut.\nVousy: 30 minut.\nVlasy a vousy: 75-90 minut.\nDětské stříhání: 30 minut.\n\nVíc služeb v jednom termínu jde po domluvě podle obsazenosti. Méně vytížené časy řešíte s holičem na místě, nebo telefonicky s operátorem.",
      showFollowUp: true,
      options: [
        TO_SLOTS,
        {
          id: "svc_duration_price",
          label: "Ceník",
          nextNodeId: "svc_price_answer",
        },
        CALL_SUPPORT,
      ],
    },

    /* ── Služby domů / eventy / firmy ── */
    outside_salon_menu: {
      id: "outside_salon_menu",
      message: "Služby mimo běžnou návštěvu salonu. Co vás zajímá?",
      options: [
        {
          id: "outside_events",
          label: "Služby domů / eventy",
          nextNodeId: "events_menu",
        },
        {
          id: "outside_business",
          label: "Real Barber pro firmy",
          nextNodeId: "business_menu",
        },
        BACK,
      ],
    },
    events_menu: {
      id: "events_menu",
      message: "O jaký typ služby mimo salon jde?",
      options: [
        {
          id: "evt_home",
          label: "Služby domů",
          nextNodeId: "evt_home_answer",
        },
        {
          id: "evt_party",
          label: "Svatba / oslava / firma",
          nextNodeId: "evt_party_answer",
        },
        {
          id: "evt_school",
          label: "Pro školy",
          nextNodeId: "evt_school_answer",
        },
        {
          id: "evt_back_outside",
          label: "Zpět",
          nextNodeId: "outside_salon_menu",
        },
      ],
    },
    evt_home_answer: {
      id: "evt_home_answer",
      message:
        "Barber může přijet k vám domů. Cena se odvíjí od vzdálenosti, cesty a konkrétní služby. Domluvíme telefonicky na +420 608 332 881. Lze i mimo běžné hodiny.",
      showFollowUp: true,
      options: [
        {
          id: "evt_home_link",
          label: "Služby domů",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "/rezervace/sluzby-domu",
        },
        CALL_SUPPORT,
      ],
    },
    evt_party_answer: {
      id: "evt_party_answer",
      message:
        "Real Barber umí přijet na svatbu, oslavu nebo firemní akci. Domluvte telefonicky termín, počet lidí a místo, případně vás spojíme s operátorem.",
      showFollowUp: true,
      options: [
        {
          id: "evt_party_business",
          label: "Real Barber pro firmy",
          nextNodeId: "business_menu",
        },
        TO_OPERATOR,
      ],
    },
    evt_school_answer: {
      id: "evt_school_answer",
      message:
        "Nabízíme seminář pro studenty 1.-3. ročníků. Pomáhá porozumět základním principům technik stříhání, podnikání a budování kariéry. Kontakt: info@realbarber.cz nebo +420 608 332 881.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT, TO_OPERATOR],
    },

    /* ── Real Barber pro firmy ── */
    business_menu: {
      id: "business_menu",
      message: "Co vás zajímá ohledně spolupráce s firmami?",
      options: [
        {
          id: "biz_event",
          label: "Firemní akce / teambuilding",
          nextNodeId: "biz_event_answer",
        },
        {
          id: "biz_regular",
          label: "Pravidelná péče pro zaměstnance",
          nextNodeId: "biz_regular_answer",
        },
        {
          id: "biz_invoice",
          label: "Fakturace pro firmy",
          nextNodeId: "biz_invoice_answer",
        },
        {
          id: "biz_contact",
          label: "Kontakt obchodního oddělení",
          nextNodeId: "biz_contact_answer",
        },
        {
          id: "biz_back_outside",
          label: "Zpět",
          nextNodeId: "outside_salon_menu",
        },
      ],
    },
    biz_event_answer: {
      id: "biz_event_answer",
      message:
        "Real Barber umí přijet na firemní akci nebo teambuilding. Domluvte telefonicky termín, počet lidí a místo (+420 608 332 881), případně vás spojíme s operátorem.",
      showFollowUp: true,
      options: [
        {
          id: "biz_event_events",
          label: "Služby mimo salon",
          nextNodeId: "events_menu",
        },
        TO_OPERATOR,
      ],
    },
    biz_regular_answer: {
      id: "biz_regular_answer",
      message:
        "Pro firmy nabízíme pravidelnou péči pro zaměstnance na pobočce nebo u vás. Napište na info@realbarber.cz nebo volejte +420 608 332 881.",
      showFollowUp: true,
    },
    biz_invoice_answer: {
      id: "biz_invoice_answer",
      message:
        "Firemní fakturaci vyřídíme na info@realbarber.cz. Uveďte IČO, počet osob a požadovaný rozsah služeb.",
      showFollowUp: true,
    },
    biz_contact_answer: {
      id: "biz_contact_answer",
      message:
        "Obchodní oddělení kontaktujte na info@realbarber.cz nebo +420 608 332 881. Rádi připravíme nabídku na míru.",
      showFollowUp: true,
    },

    /* ── Platby ── */
    payments_menu: {
      id: "payments_menu",
      message: "Co přesně ohledně plateb budeme řešit?",
      options: [
        {
          id: "pay_card",
          label: "Platba kartou / hotově",
          nextNodeId: "pay_card_answer",
        },
        {
          id: "pay_double",
          label: "Dvojí stržení / omyl",
          nextNodeId: "pay_double_answer",
        },
        {
          id: "pay_voucher",
          label: "Dárkový poukaz",
          nextNodeId: "gift_voucher_answer",
        },
        TO_PROMO,
        TO_COUPON_ISSUE,
        {
          id: "pay_tip",
          label: "Spropitné",
          nextNodeId: "pay_tip_answer",
        },
        {
          id: "pay_invoice",
          label: "Faktura / potvrzení",
          nextNodeId: "pay_invoice_answer",
        },
        BACK,
      ],
    },
    pay_card_answer: {
      id: "pay_card_answer",
      message:
        "Na všech pobočkách přijímáme hotovost i kartu. Ceny jsou všude stejné dle aktuálního ceníku. Účtenku z platby kartou vám holič nabídne hned na místě po zaplacení.",
      showFollowUp: true,
    },
    pay_double_answer: {
      id: "pay_double_answer",
      message:
        "Pokud vám byla platba naúčtována dvakrát, ozvěte se nám ihned. Situaci začneme řešit a při oprávněném nároku peníze dostanete okamžitě zpět. Ozvěte se na +420 608 332 881. Děkujeme a věříme, že šlo pouze o omyl.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT, TO_OPERATOR],
    },
    pay_tip_answer: {
      id: "pay_tip_answer",
      message:
        "Pokud personálu provozovny zanecháte spropitné, po vašem odchodu již není možné požadovat jeho vrácení.",
      showFollowUp: true,
      options: [BACK],
    },
    pay_coupon_issue_answer: {
      id: "pay_coupon_issue_answer",
      message:
        "Pokud nejde kupón uplatnit, je buď již neaktivní, vyčerpaný, nebo pro jeho využití nemáte nárok.\n\nDůležité: rezervaci, na kterou se objednáte s kupónem, v případě jejího zrušení bereme tak, jako byste kupón již využili.",
      showFollowUp: true,
      options: [TO_PROMO, TO_APP, CALL_SUPPORT, TO_BOOKINGS],
    },
    pay_invoice_answer: {
      id: "pay_invoice_answer",
      message:
        "Pokud potřebujete dodat fakturu, napište na info@realbarber.cz nebo volejte +420 608 332 881. Fakturu vám zašleme na kontakt, který nám zadáte. Účtenku z karty dostanete na místě po zaplacení.",
      showFollowUp: true,
      options: [
        CALL_SUPPORT,
        EMAIL_SUPPORT,
        {
          id: "pay_invoice_mail",
          label: "E-mail: žádost o fakturu",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "mailto:info@realbarber.cz?subject=Zadost%20o%20fakturu",
        },
      ],
    },

    /* ── Follow-up & misc ── */
    after_help: {
      id: "after_help",
      message: "Pomohlo to? Co dál?",
      options: [
        {
          id: "follow_menu",
          label: "Zpět do menu",
          nextNodeId: "main_menu",
        },
        {
          id: "follow_done",
          label: "Hotovo, díky",
          nextNodeId: "goodbye",
        },
        TO_OPERATOR,
      ],
    },
    /**
     * Host otevřel OperatorSupportSheet (onSupportRequest).
     * Fallback bez callbacku zůstává operator_contact.
     */
    operator_host_support: {
      id: "operator_host_support",
      message:
        "Otevřeli jsme kontaktování podpory. Ve sheetu vyberte telefon, WhatsApp nebo Telegram. Můžete také pokračovat níže.",
      showFollowUp: true,
      options: [CALL_SUPPORT, EMAIL_SUPPORT, BACK],
    },
    /**
     * Dočasná náhrada live operátora (viz LIVE_OPERATOR_ENABLED).
     * Kanály WhatsApp / Telegram / SMS / Hovor; mimo dobu doplní upozornění.
     */
    operator_contact: {
      id: OPERATOR_CONTACT_NODE_ID,
      message: operatorContactMessage(),
      options: [...operatorContactChannelOptions(), BACK],
    },
    /** Live handoff prompt. Kept for re-enable via LIVE_OPERATOR_ENABLED. */
    operator_live: {
      id: "operator_live",
      message:
        "Po vašem dotazu vás spojíme s operátorem. Napište prosím, s čím potřebujete pomoct.",
      options: [],
    },
    operator_off_hours: {
      id: "operator_off_hours",
      message:
        "Živá podpora je teď mimo provoz (Po-Pa 8:30-21:30, So-Ne 9:30-18:30). Mezitím volejte +420 608 332 881 nebo pište na info@realbarber.cz.",
      showFollowUp: true,
      options: [
        {
          id: "off_hours_call",
          label: "Zavolat",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "tel:+420608332881",
        },
        {
          id: "off_hours_mail",
          label: "Napsat e-mail",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "mailto:info@realbarber.cz",
        },
        TO_GDPR,
        TO_MISC,
      ],
    },
    operator_unavailable: {
      id: "operator_unavailable",
      message:
        "Spojení s operátorem se teď nepodařilo. Zkuste to prosím znovu, nebo volejte +420 608 332 881 / info@realbarber.cz.",
      showFollowUp: true,
      options: [
        TO_OPERATOR,
        {
          id: "unavailable_call",
          label: "Zavolat",
          nextNodeId: "after_help",
          action: "openUrl",
          url: "tel:+420608332881",
        },
        TO_MISC,
      ],
    },
    operator_placeholder: {
      id: "operator_placeholder",
      message:
        "Spojení s operátorem připravujeme. Mezitím nás kontaktujte na +420 608 332 881 nebo info@realbarber.cz.",
      showFollowUp: true,
      options: [TO_GDPR, TO_MISC],
    },
    goodbye: {
      id: "goodbye",
      message: "Děkujeme! Kdykoli se ozvěte. Rbíček je tu pro vás.",
      options: GOODBYE_FOLLOWUP,
    },
    goodbye_joke: {
      id: "goodbye_joke",
      // Text se bere dynamicky z `@/data/jokes` (nextJoke).
      message: "Mám pro vás vtip.",
      options: [
        { id: "goodbye_joke_menu", label: "Zpět do menu", nextNodeId: "main_menu" },
        {
          id: "goodbye_joke_more",
          label: "Ještě jeden vtip",
          nextNodeId: "goodbye_joke",
        },
      ],
    },
    goodbye_joke_alt: {
      id: "goodbye_joke_alt",
      // Alias: stejný pool jako goodbye_joke (historické nextNodeId).
      message: "Mám pro vás vtip.",
      options: [
        {
          id: "goodbye_joke_alt_menu",
          label: "Zpět do menu",
          nextNodeId: "main_menu",
        },
        {
          id: "goodbye_joke_alt_more",
          label: "Ještě jeden vtip",
          nextNodeId: "goodbye_joke",
        },
      ],
    },
    off_topic_guard: {
      id: "off_topic_guard",
      message:
        "Očekávám dotazy týkající se Real Barber. Vyberte téma níže nebo nás kontaktujte.",
      options: WELCOME_QUICK_OPTIONS,
    },
    free_text_placeholder: {
      id: "free_text_placeholder",
      message:
        "Vlastní dotazy zatím zpracováváme. Brzy je zvládne Rbíček. Zatím si prosím vyberte možnost z nabídky.",
      options: [
        { id: "free_text_menu", label: "Zpět do menu", nextNodeId: "main_menu" },
        TO_SLOTS,
        TO_GUIDE,
      ],
    },
    idle_reminder: {
      id: "idle_reminder",
      message: "Jsem stále k dispozici. Vyberte téma nebo napište dotaz.",
      options: IDLE_RESUME_OPTIONS,
    },

    ...buildHaircutFlowNodes(),
    ...buildTeamFlowNodes(),
    ...buildBranchFlowNodes(),
    ...buildBlogFlowNodes(),
  },
};

export type ApiResponseContext = {
  slotsCount: number;
  teamCount: number;
  teamFullyBookedCount: number;
  branchesCount: number;
  promosCount: number;
};

function appendFollowUpOptions(
  nodeId: string,
  options: FlowOption[],
): FlowOption[] {
  const node = flowDefinition.nodes[nodeId];
  if (!node?.showFollowUp || nodeId === flowDefinition.followUpNodeId) {
    return moveOperatorLast(limitResponseOptions(options));
  }

  const merged = [...options];
  for (const followUp of flowDefinition.followUpOptions) {
    if (!merged.some((option) => option.id === followUp.id)) {
      merged.push(followUp);
    }
  }
  return moveOperatorLast(limitResponseOptions(merged));
}

/** Kontextové chipy po API odpovědi (prázdné termíny, plní holiči…). */
export function buildApiContextOptions(
  nodeId: string,
  context: ApiResponseContext,
): FlowOption[] | null {
  if (nodeId === "api_slots") {
    if (context.slotsCount === 0) {
      return [TO_BRANCHES, TO_TEAM, TO_WAITLIST, TO_OPERATOR];
    }
    if (context.slotsCount <= 2) {
      return [TO_BRANCHES, TO_TEAM, TO_WAITLIST, TO_BOOKINGS];
    }
    return null;
  }

  if (nodeId === "api_team") {
    if (context.teamCount === 0) {
      return [TO_SLOTS, TO_BRANCHES, TO_OPERATOR];
    }
    if (context.teamFullyBookedCount > 0) {
      return [TO_WAITLIST, TO_SLOTS, TO_BRANCHES];
    }
    return null;
  }

  if (nodeId === "api_branches") {
    return [TO_SLOTS, TO_TEAM, TO_WAITLIST];
  }

  if (nodeId === "api_promo") {
    if (context.promosCount === 0) {
      return [TO_COUPON_ISSUE, TO_SLOTS, TO_BOOKINGS, TO_BRANCHES];
    }
    return null;
  }

  return null;
}

/** Quick reply po API: kontextové chipy nebo výchozí uzel + follow-up. */
export function buildOptionsAfterApi(
  nodeId: string,
  context: ApiResponseContext,
  isLoggedIn: boolean,
  locale: WidgetLocale = "cs",
): FlowOption[] {
  const contextual = buildApiContextOptions(nodeId, context);
  if (contextual) {
    return localizeOptions(appendFollowUpOptions(nodeId, contextual), locale);
  }
  return buildActiveOptions(nodeId, isLoggedIn, locale);
}

export function apiContextFromMessage(message: ChatMessage): ApiResponseContext {
  const team = message.team ?? [];
  return {
    slotsCount: message.slots?.length ?? 0,
    teamCount: team.length,
    teamFullyBookedCount: team.filter((member) => member.fullyBookedToday)
      .length,
    branchesCount: message.branches?.length ?? 0,
    promosCount: message.promos?.length ?? 0,
  };
}

export function getNodeOptions(
  nodeId: string,
  isLoggedIn: boolean,
): FlowDefinition["nodes"][string]["options"] {
  const node = flowDefinition.nodes[nodeId];
  if (!node?.options) return undefined;

  return node.options.filter((opt) => {
    if (opt.requiresAuth && !isLoggedIn) return false;
    if (opt.requiresGuest && isLoggedIn) return false;

    const target = flowDefinition.nodes[opt.nextNodeId];
    if (target?.requiresAuth && !isLoggedIn) return false;
    return true;
  });
}

/** Všechny možnosti zobrazené jako quick reply pro daný uzel. */
export function buildActiveOptions(
  nodeId: string,
  isLoggedIn: boolean,
  locale: WidgetLocale = "cs",
): FlowOption[] {
  const node = flowDefinition.nodes[nodeId];
  if (!node) return [];

  const options = [...(getNodeOptions(nodeId, isLoggedIn) ?? [])];

  if (node.showFollowUp && nodeId !== flowDefinition.followUpNodeId) {
    for (const followUp of flowDefinition.followUpOptions) {
      if (!options.some((o) => o.id === followUp.id)) {
        options.push(followUp);
      }
    }
  }

  return localizeOptions(
    moveOperatorLast(limitResponseOptions(options)),
    locale,
  );
}

export function resolveOption(
  nodeId: string,
  optionId: string,
  isLoggedIn: boolean,
  locale: WidgetLocale = "cs",
): FlowOption | undefined {
  return buildActiveOptions(nodeId, isLoggedIn, locale).find(
    (o) => o.id === optionId,
  );
}
