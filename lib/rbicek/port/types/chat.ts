export type MessageRole = "assistant" | "user" | "operator" | "system";

export type MessageKind = "text" | "slots" | "team" | "branches" | "promo";

/** Flow chips vs awaiting first live question vs live operator WS. */
export type ChatMode = "flow" | "awaiting_operator" | "live_operator";

export interface SlotCardData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  branchName: string;
  branchAddress?: string;
  /** Formátované datum pro zobrazení */
  date: string;
  /** ISO datum YYYY-MM-DD */
  dateRaw: string;
  time: string;
  endTime?: string;
  duration?: number;
  serviceName?: string;
  servicePrice?: number;
  profileUrl?: string;
  bookingUrl: string;
}

export interface TeamMemberCardData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  branchName: string;
  hours: string;
  profileUrl: string;
  /** Na směně dnes, ale bez volného slotu dnes */
  fullyBookedToday?: boolean;
  nextSlotDateRaw?: string;
  nextSlotTime?: string;
  bookingUrl?: string;
}

export interface BranchCardData {
  id: string;
  name: string;
  district: string;
  imageUrl?: string | null;
  detailUrl: string;
  address?: string;
  note?: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
}

export interface PromoCardData {
  id: string;
  key: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  imageAlt: string;
  actionLabel: string;
  detailUrl: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  text: string;
  slots?: SlotCardData[];
  team?: TeamMemberCardData[];
  branches?: BranchCardData[];
  promos?: PromoCardData[];
  /** Quick reply chipy v bublině bota */
  quickReplies?: QuickReply[];
  /** Po výběru možnosti jsou chipy neaktivní */
  chipsExpired?: boolean;
  /** Jméno operátora u live zpráv */
  authorName?: string;
  /** Dedup klíč z public API / WS */
  eventKey?: string;
  /** Malý avatar Rbíčka vedle bubliny (typicky welcome). */
  showAvatar?: boolean;
  timestamp: number;
}

export interface QuickReply {
  id: string;
  label: string;
  /** Volitelný podtitul (např. název pobočky u tlačítka Detail) */
  sublabel?: string;
}

export type ApiHandlerId = "slots" | "todayTeam" | "branches" | "promo";

export type FlowActionType =
  | "navigate"
  | "openUrl"
  | "openReservations"
  | "reset"
  | "end";

export type WidgetPlatform = "web" | "app";

export interface FlowOption {
  id: string;
  label: string;
  sublabel?: string;
  nextNodeId: string;
  action?: FlowActionType;
  url?: string;
  /** Zobrazit jen přihlášeným */
  requiresAuth?: boolean;
  /** Zobrazit jen nepřihlášeným */
  requiresGuest?: boolean;
  /** Web-only chipy (App Store, Stáhnout appku, …) se v appce skryjí. */
  requiresPlatform?: WidgetPlatform;
}

export interface FlowNode {
  id: string;
  /** Statický text bota; u API uzlů se doplní dynamicky */
  message: string;
  /** Alternativní text pro přihlášeného uživatele */
  messageLoggedIn?: string;
  options?: FlowOption[];
  apiHandler?: ApiHandlerId;
  /** Po odpovědi zobrazit follow-up „Pomohlo to?“ */
  showFollowUp?: boolean;
  /** Vyžaduje přihlášení. Zatím architektura, login nudge se nepoužívá v MVP */
  requiresAuth?: boolean;
}

export interface FlowDefinition {
  startNodeId: string;
  nodes: Record<string, FlowNode>;
  followUpNodeId: string;
  followUpOptions: FlowOption[];
}
