import {
  apiContextFromMessage,
  buildActiveOptions,
  buildOptionsAfterApi,
  flowDefinition,
  getStartNodeId,
  getWelcomeMessage,
  jokeReplyOptions,
  resolveNodeMessage,
  resolveOption,
} from '@/lib/rbicek/port/flow/definition';
import {
  isJokeNodeId,
  isJokeRoundStart,
  resetJokeDeck,
  takeNextJoke,
} from '@/lib/rbicek/port/data/jokes';
import { tSystem } from '@/lib/rbicek/port/i18n/system';
import {
  LIVE_OPERATOR_ENABLED,
  OPERATOR_CONTACT_NODE_ID,
} from '@/lib/rbicek/port/lib/liveOperator';
import type { WidgetLocale } from '@/lib/rbicek/port/types/config';
import type { ChatMessage, FlowOption, QuickReply } from '@/lib/rbicek/port/types/chat';
import {
  fetchBranches,
  fetchNearestSlots,
  fetchPromoCards,
  fetchTodayTeam,
} from '@/lib/rbicek/crm/client';
import { STATIC_BRANCHES } from '@/lib/rbicek/crm/mapCards';
import type { RbicekHostBridge, RbicekRuntimeConfig } from '@/lib/rbicek/types';
import { randomId } from '@/lib/rbicek/utils';

export function widgetLocale(config: Pick<RbicekRuntimeConfig, 'locale'>): WidgetLocale {
  return config.locale === 'en' || config.locale === 'uk' ? config.locale : 'cs';
}

function optionsToQuickReplies(options: FlowOption[]): QuickReply[] {
  return options.map((o) => ({
    id: o.id,
    label: o.label,
    sublabel: o.sublabel,
  }));
}

export function userMessage(text: string): ChatMessage {
  return {
    id: randomId('msg'),
    role: 'user',
    kind: 'text',
    text,
    timestamp: Date.now(),
  };
}

function botText(text: string, kind: ChatMessage['kind'] = 'text'): ChatMessage {
  return {
    id: randomId('msg'),
    role: 'assistant',
    kind,
    text,
    timestamp: Date.now(),
  };
}

export function botMessageWithChips(
  text: string,
  options: FlowOption[],
  extras: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    ...botText(text, extras.kind),
    ...extras,
    quickReplies: optionsToQuickReplies(options),
    chipsExpired: false,
  };
}

export function expireLatestChips(messages: ChatMessage[]): ChatMessage[] {
  let expired = false;
  return [...messages]
    .reverse()
    .map((message) => {
      if (expired) return message;
      if (
        message.role === 'assistant' &&
        message.quickReplies?.length &&
        !message.chipsExpired
      ) {
        expired = true;
        return { ...message, chipsExpired: true };
      }
      return message;
    })
    .reverse();
}

function teamApiMessage(team: NonNullable<ChatMessage['team']>, locale: WidgetLocale): string {
  if (!team.length) return tSystem('teamEmpty', locale);
  if (team.every((member) => member.fullyBookedToday)) {
    return tSystem('teamWorkingFull', locale);
  }
  return tSystem('teamWorking', locale);
}

export async function buildApiMessage(
  nodeId: string,
  config: RbicekRuntimeConfig
): Promise<ChatMessage> {
  const node = flowDefinition.nodes[nodeId];
  const locale = widgetLocale(config);
  if (!node?.apiHandler) {
    return botText(resolveNodeMessage(node, config.isLoggedIn, locale));
  }

  try {
    if (node.apiHandler === 'slots') {
      const slots = await fetchNearestSlots(config.locale, config.userToken);
      if (!slots.length) {
        return { ...botText(tSystem('slotsEmpty', locale), 'slots'), slots: [] };
      }
      if (slots.length <= 2) {
        return { ...botText(tSystem('slotsFew', locale), 'slots'), slots };
      }
      return { ...botText(tSystem('slotsIntro', locale), 'slots'), slots };
    }

    if (node.apiHandler === 'todayTeam') {
      const team = await fetchTodayTeam(config.locale, config.userToken);
      return {
        ...botText(teamApiMessage(team, locale), 'team'),
        team,
      };
    }

    if (node.apiHandler === 'branches') {
      let branches = await fetchBranches(config.locale, config.userToken);
      if (!branches.length) branches = STATIC_BRANCHES;
      return {
        ...botText(resolveNodeMessage(node, config.isLoggedIn, locale), 'branches'),
        branches,
      };
    }

    const promos = await fetchPromoCards(
      config.locale,
      config.userId,
      config.userToken,
      config.webBaseUrl
    );
    if (!promos.length) {
      return { ...botText(tSystem('promoEmpty', locale), 'promo'), promos: [] };
    }
    return { ...botText(tSystem('promoIntro', locale), 'promo'), promos };
  } catch {
    if (node.apiHandler === 'slots') {
      return botText(tSystem('slotsFallback', locale));
    }
    if (node.apiHandler === 'todayTeam') {
      return botText(tSystem('teamFallback', locale));
    }
    if (node.apiHandler === 'promo') {
      return botText(tSystem('promoFallback', locale));
    }
    return {
      ...botText(tSystem('branchesFallback', locale), 'branches'),
      branches: STATIC_BRANCHES,
    };
  }
}

export function buildWelcomeMessage(config: RbicekRuntimeConfig): ChatMessage {
  const startNodeId = getStartNodeId(config.isLoggedIn);
  const locale = widgetLocale(config);
  const options = buildActiveOptions(startNodeId, config.isLoggedIn, locale);
  return botMessageWithChips(
    getWelcomeMessage(config.isLoggedIn, config.userDisplayName ?? undefined, locale),
    options,
    { showAvatar: true }
  );
}

export function buildNodeReply(
  nodeId: string,
  config: RbicekRuntimeConfig,
  extra?: Partial<ChatMessage>
): ChatMessage {
  const node = flowDefinition.nodes[nodeId];
  const locale = widgetLocale(config);
  const options = buildActiveOptions(nodeId, config.isLoggedIn, locale);
  return botMessageWithChips(
    resolveNodeMessage(node, config.isLoggedIn, locale),
    options,
    {
      showAvatar: nodeId === 'welcome' || nodeId === 'welcome_logged_in',
      ...extra,
    }
  );
}

export interface SelectOptionResult {
  messages: ChatMessage[];
  currentNodeId: string;
  closeAndOpenReservations?: boolean;
  openSupportChannels?: boolean;
}

export async function processOptionSelection(params: {
  optionId: string;
  currentNodeId: string;
  messages: ChatMessage[];
  config: RbicekRuntimeConfig;
  bridge: RbicekHostBridge;
}): Promise<SelectOptionResult | null> {
  const { optionId, currentNodeId, messages, config, bridge } = params;
  const locale = widgetLocale(config);
  const option = resolveOption(currentNodeId, optionId, config.isLoggedIn, locale);
  if (!option) return null;

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const activeOnMessage = lastAssistant?.quickReplies ?? [];
  if (!activeOnMessage.some((q) => q.id === optionId) || lastAssistant?.chipsExpired) {
    return null;
  }

  if (option.requiresAuth && !config.isLoggedIn) {
    bridge.requestLogin();
    return null;
  }

  const expiredMessages = expireLatestChips(messages);
  const newMessages = [...expiredMessages, userMessage(option.label)];

  if (option.action === 'openUrl' && option.url) {
    bridge.openExternalUrl(option.url);
  }

  if (option.action === 'reset') {
    return {
      messages: [buildWelcomeMessage(config)],
      currentNodeId: getStartNodeId(config.isLoggedIn),
    };
  }

  const isSupportChip =
    option.id === 'follow_operator' ||
    option.nextNodeId === OPERATOR_CONTACT_NODE_ID ||
    option.nextNodeId === 'operator_live';

  if (isSupportChip && !LIVE_OPERATOR_ENABLED) {
    const hostNode = flowDefinition.nodes.operator_host_support!;
    const options = buildActiveOptions('operator_host_support', config.isLoggedIn, locale);
    return {
      messages: [
        ...newMessages,
        botMessageWithChips(
          resolveNodeMessage(hostNode, config.isLoggedIn, locale),
          options
        ),
      ],
      currentNodeId: 'operator_host_support',
      openSupportChannels: true,
    };
  }

  const nextNode = flowDefinition.nodes[option.nextNodeId];
  if (!nextNode) return null;

  let botReply: ChatMessage;

  if (nextNode.apiHandler) {
    const apiReply = await buildApiMessage(option.nextNodeId, config);
    const options = buildOptionsAfterApi(
      option.nextNodeId,
      apiContextFromMessage(apiReply),
      config.isLoggedIn,
      locale
    );
    botReply = {
      ...apiReply,
      quickReplies: optionsToQuickReplies(options),
      chipsExpired: false,
    };
  } else if (isJokeNodeId(option.nextNodeId)) {
    if (isJokeRoundStart(option.id)) {
      resetJokeDeck();
    }
    const { text, hasMore } = takeNextJoke();
    botReply = botMessageWithChips(text, jokeReplyOptions(hasMore, locale));
  } else {
    const options = buildActiveOptions(option.nextNodeId, config.isLoggedIn, locale);
    botReply = botMessageWithChips(
      resolveNodeMessage(nextNode, config.isLoggedIn, locale),
      options
    );
  }

  const result: SelectOptionResult = {
    messages: [...newMessages, botReply],
    currentNodeId: option.nextNodeId,
    closeAndOpenReservations: option.action === 'openReservations',
  };

  if (option.action === 'openReservations' && !config.isLoggedIn) {
    bridge.requestLogin();
    return null;
  }

  return result;
}

export function processNavigateToNode(params: {
  nodeId: string;
  userLabel: string;
  messages: ChatMessage[];
  config: RbicekRuntimeConfig;
}): SelectOptionResult | null {
  const { nodeId, userLabel, messages, config } = params;
  const locale = widgetLocale(config);
  const nextNode = flowDefinition.nodes[nodeId];
  if (!nextNode) return null;

  const expiredMessages = expireLatestChips(messages);
  const options = buildActiveOptions(nodeId, config.isLoggedIn, locale);

  return {
    messages: [
      ...expiredMessages,
      userMessage(userLabel),
      botMessageWithChips(resolveNodeMessage(nextNode, config.isLoggedIn, locale), options),
    ],
    currentNodeId: nodeId,
  };
}

export function buildIdleReminder(config: RbicekRuntimeConfig): ChatMessage {
  const locale = widgetLocale(config);
  const idleNode = flowDefinition.nodes.idle_reminder!;
  const options = buildActiveOptions('idle_reminder', config.isLoggedIn, locale);
  return botMessageWithChips(
    resolveNodeMessage(idleNode, config.isLoggedIn, locale),
    options
  );
}
