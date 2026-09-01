import { flowMessage, flowMessageLoggedIn, localizeOptions } from '@/lib/rbicek/port/i18n/flow';
import { withoutDashes } from '@/lib/rbicek/port/i18n/locale';
import { tSystem } from '@/lib/rbicek/port/i18n/system';
import { isJokeNodeId } from '@/lib/rbicek/port/data/jokes';
import { limitResponseOptions } from '@/lib/rbicek/port/flow/limitOptions';
import {
  OPERATOR_CONTACT_NODE_ID,
  operatorContactMessage,
  operatorEntryOption,
} from '@/lib/rbicek/port/lib/liveOperator';
import type { WidgetLocale } from '@/lib/rbicek/port/types/config';
import type {
  ChatMessage,
  FlowDefinition,
  FlowOption,
  WidgetPlatform,
} from '@/lib/rbicek/port/types/chat';

import { flowDefinition, getFlowSnapshotConstants } from './snapshot';

const OPERATOR_OPTION_ID = 'follow_operator';

const TO_SLOTS: FlowOption = {
  id: 'cross_slots',
  label: 'Nejbližší termíny',
  nextNodeId: 'api_slots',
};
const TO_TEAM: FlowOption = {
  id: 'cross_team',
  label: 'Kdo dnes pracuje',
  nextNodeId: 'api_team',
};
const TO_BRANCHES: FlowOption = {
  id: 'cross_branches',
  label: 'Pobočky',
  nextNodeId: 'api_branches',
};
const TO_BOOKINGS: FlowOption = {
  id: 'cross_bookings',
  label: 'Moje rezervace',
  nextNodeId: 'bookings_menu',
};
const TO_OPERATOR: FlowOption = operatorEntryOption();
const TO_WAITLIST: FlowOption = {
  id: 'cross_waitlist',
  label: 'Čekací listina',
  nextNodeId: 'waitlist_answer',
};
const TO_COUPON_ISSUE: FlowOption = {
  id: 'pay_coupon_issue',
  label: 'Nejde mi uplatnit kupón',
  nextNodeId: 'pay_coupon_issue_answer',
};

function maxResponseOptions(): number {
  return getFlowSnapshotConstants().maxResponseOptions;
}

function moveOperatorLast(options: FlowOption[]): FlowOption[] {
  const operator = options.filter((option) => option.id === OPERATOR_OPTION_ID);
  if (!operator.length) return options;
  return [...options.filter((option) => option.id !== OPERATOR_OPTION_ID), ...operator];
}

export function getStartNodeId(isLoggedIn: boolean): string {
  return isLoggedIn ? 'welcome_logged_in' : flowDefinition.startNodeId;
}

export function getWelcomeMessage(
  isLoggedIn: boolean,
  userDisplayName?: string,
  locale: WidgetLocale = 'cs'
): string {
  if (isLoggedIn) {
    const firstName = userDisplayName?.trim().split(/\s+/)[0];
    if (firstName) {
      return tSystem('welcomeNamed', locale, { name: firstName });
    }
    return tSystem('welcomeLogged', locale);
  }
  return tSystem('welcomeHub', locale);
}

export function resolveNodeMessage(
  node: { id?: string; message: string; messageLoggedIn?: string } | undefined,
  isLoggedIn: boolean,
  locale: WidgetLocale = 'cs'
): string {
  if (!node) return '';
  if (isJokeNodeId(node.id)) return withoutDashes(node.message);
  if (node.id === OPERATOR_CONTACT_NODE_ID) {
    return operatorContactMessage(new Date(), locale);
  }
  if (isLoggedIn && node.messageLoggedIn) {
    return flowMessageLoggedIn(node.id, node.messageLoggedIn, locale);
  }
  return flowMessage(node.id, node.message, locale);
}

export function jokeReplyOptions(
  hasMore: boolean,
  locale: WidgetLocale = 'cs'
): FlowOption[] {
  const options: FlowOption[] = [
    {
      id: 'goodbye_joke_menu',
      label: 'Zpět do menu',
      nextNodeId: 'main_menu',
    },
  ];
  if (hasMore) {
    options.push({
      id: 'goodbye_joke_more',
      label: 'Ještě jeden vtip',
      nextNodeId: 'goodbye_joke',
    });
  }
  return localizeOptions(options, locale);
}

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
  isLoggedIn: boolean,
  platform: WidgetPlatform
): FlowOption[] {
  const node = flowDefinition.nodes[nodeId];
  if (!node?.showFollowUp || nodeId === flowDefinition.followUpNodeId) {
    return moveOperatorLast(limitResponseOptions(options, maxResponseOptions()));
  }

  const merged = [...options];
  for (const followUp of flowDefinition.followUpOptions) {
    if (!isOptionVisible(followUp, isLoggedIn, platform)) continue;
    if (!merged.some((option) => option.id === followUp.id)) {
      merged.push(followUp);
    }
  }
  return moveOperatorLast(limitResponseOptions(merged, maxResponseOptions()));
}

/** Stejná logika jako web `@rbicek/widget`. */
export function isOptionVisible(
  option: FlowOption,
  isLoggedIn: boolean,
  platform: WidgetPlatform = 'app'
): boolean {
  if (option.requiresAuth && !isLoggedIn) return false;
  if (option.requiresGuest && isLoggedIn) return false;
  if (option.requiresPlatform && option.requiresPlatform !== platform) return false;
  return true;
}

export function buildApiContextOptions(
  nodeId: string,
  context: ApiResponseContext
): FlowOption[] | null {
  if (nodeId === 'api_slots') {
    if (context.slotsCount === 0) {
      return [TO_BRANCHES, TO_TEAM, TO_WAITLIST, TO_OPERATOR];
    }
    if (context.slotsCount <= 2) {
      return [TO_BRANCHES, TO_TEAM, TO_WAITLIST, TO_BOOKINGS];
    }
    return null;
  }

  if (nodeId === 'api_team') {
    if (context.teamCount === 0) {
      return [TO_SLOTS, TO_BRANCHES, TO_OPERATOR];
    }
    if (context.teamFullyBookedCount > 0) {
      return [TO_WAITLIST, TO_SLOTS, TO_BRANCHES];
    }
    return null;
  }

  if (nodeId === 'api_branches') {
    return [TO_SLOTS, TO_TEAM, TO_WAITLIST];
  }

  if (nodeId === 'api_promo') {
    if (context.promosCount === 0) {
      return [TO_COUPON_ISSUE, TO_SLOTS, TO_BOOKINGS, TO_BRANCHES];
    }
    return null;
  }

  return null;
}

export function buildOptionsAfterApi(
  nodeId: string,
  context: ApiResponseContext,
  isLoggedIn: boolean,
  locale: WidgetLocale = 'cs',
  platform: WidgetPlatform = 'app'
): FlowOption[] {
  const contextual = buildApiContextOptions(nodeId, context);
  if (contextual) {
    return localizeOptions(
      appendFollowUpOptions(nodeId, contextual, isLoggedIn, platform),
      locale
    );
  }
  return buildActiveOptions(nodeId, isLoggedIn, locale, platform);
}

export function apiContextFromMessage(message: ChatMessage): ApiResponseContext {
  const team = message.team ?? [];
  return {
    slotsCount: message.slots?.length ?? 0,
    teamCount: team.length,
    teamFullyBookedCount: team.filter((member) => member.fullyBookedToday).length,
    branchesCount: message.branches?.length ?? 0,
    promosCount: message.promos?.length ?? 0,
  };
}

export function getNodeOptions(
  nodeId: string,
  isLoggedIn: boolean,
  platform: WidgetPlatform = 'app'
): FlowDefinition['nodes'][string]['options'] {
  const node = flowDefinition.nodes[nodeId];
  if (!node?.options) return undefined;

  return node.options.filter((opt) => {
    if (!isOptionVisible(opt, isLoggedIn, platform)) return false;

    const target = flowDefinition.nodes[opt.nextNodeId];
    if (target?.requiresAuth && !isLoggedIn) return false;
    return true;
  });
}

export function buildActiveOptions(
  nodeId: string,
  isLoggedIn: boolean,
  locale: WidgetLocale = 'cs',
  platform: WidgetPlatform = 'app'
): FlowOption[] {
  const node = flowDefinition.nodes[nodeId];
  if (!node) return [];

  const options = [...(getNodeOptions(nodeId, isLoggedIn, platform) ?? [])];

  if (node.showFollowUp && nodeId !== flowDefinition.followUpNodeId) {
    for (const followUp of flowDefinition.followUpOptions) {
      if (!isOptionVisible(followUp, isLoggedIn, platform)) continue;
      if (!options.some((o) => o.id === followUp.id)) {
        options.push(followUp);
      }
    }
  }

  return localizeOptions(
    moveOperatorLast(limitResponseOptions(options, maxResponseOptions())),
    locale
  );
}

export function resolveOption(
  nodeId: string,
  optionId: string,
  isLoggedIn: boolean,
  locale: WidgetLocale = 'cs',
  platform: WidgetPlatform = 'app'
): FlowOption | undefined {
  return buildActiveOptions(nodeId, isLoggedIn, locale, platform).find((o) => o.id === optionId);
}

export { flowDefinition, flowSnapshotMeta, getFlowSnapshotConstants } from './snapshot';
