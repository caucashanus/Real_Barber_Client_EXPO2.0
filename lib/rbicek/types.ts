import type { Locale } from '@/contexts/LanguageContext';

export type RbicekLocale = Locale;
export type RbicekTheme = 'light' | 'dark';
export type ChatMode = 'flow' | 'awaiting_operator' | 'live_operator';
export type MessageRole = 'assistant' | 'user' | 'operator' | 'system';
export type MessageKind = 'text' | 'slots' | 'team' | 'branches' | 'promo';

export interface QuickReply {
  id: string;
  label: string;
  sublabel?: string;
}

export interface SlotCardData {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl?: string | null;
  branchId?: string;
  branchName: string;
  branchAddress?: string;
  /** Formátované datum pro zobrazení */
  date: string;
  dateRaw: string;
  time: string;
  endTime?: string;
  duration?: number;
  serviceName?: string;
  servicePrice?: number;
  profileUrl?: string;
  bookingUrl?: string;
}

export interface TeamMemberCardData {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl?: string | null;
  branchId?: string;
  branchName: string;
  hours: string;
  profileUrl?: string;
  fullyBookedToday?: boolean;
  nextSlotDateRaw?: string;
  nextSlotTime?: string;
  bookingUrl?: string;
}

export interface BranchCardData {
  id: string;
  name: string;
  district?: string;
  address?: string;
  note?: string;
  imageUrl?: string | null;
  detailUrl?: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  mapsUrl?: string;
}

export interface PromoCardData {
  id: string;
  key?: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string;
  imageAlt?: string;
  actionLabel?: string;
  detailUrl?: string;
  couponCode?: string;
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
  quickReplies?: QuickReply[];
  chipsExpired?: boolean;
  showAvatar?: boolean;
  timestamp: number;
}

export interface StoredConversation {
  id: string;
  messages: ChatMessage[];
  currentNodeId: string;
  updatedAt: number;
  createdAt: number;
  chatMode?: ChatMode;
  serverConversationId?: string;
  supportToken?: string;
}

export interface RbicekHostBridge {
  requestLogin: () => void;
  openMyReservations: () => void;
  openSupportChannels: () => void;
  openBooking: (payload: {
    employeeId?: string;
    branchId?: string;
    itemId?: string;
    date?: string;
    slotStart?: string;
  }) => void;
  openExternalUrl: (url: string) => void;
  openBarberProfile: (profileUrl: string) => void;
  openBranchDetail: (detailUrl: string) => void;
  closeChat: () => void;
}

export interface RbicekRuntimeConfig {
  locale: RbicekLocale;
  theme: RbicekTheme;
  accentColor: string;
  isLoggedIn: boolean;
  userToken?: string | null;
  userId?: string | null;
  userDisplayName?: string | null;
  webBaseUrl: string;
  apiBaseUrl: string;
  supportBaseUrl: string;
  supportPublicKey: string;
}
