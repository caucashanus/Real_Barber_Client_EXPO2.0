import { useCallback, useEffect, useRef, useState } from 'react';

import {
  RBICEK_IDLE_REMINDER_MS,
  RBICEK_PUBLIC_KEY,
  RBICEK_SUPPORT_BASE_URL,
  RBICEK_WEB_BASE_URL,
} from '@/constants/rbicek';
import { getStartNodeId } from '@/lib/rbicek/flow/runtime';
import { flowSnapshotMeta } from '@/lib/rbicek/flow/snapshot';
import {
  buildIdleReminder,
  buildWelcomeMessage,
  expireLatestChips,
  processNavigateToNode,
  processOptionSelection,
} from '@/lib/rbicek/flowEngine';
import {
  clearStoredConversation,
  loadStoredConversation,
  saveStoredConversation,
} from '@/lib/rbicek/store/persistence';
import { openPassiveSupportSession, syncSupportTranscript } from '@/lib/rbicek/support/client';
import type {
  ChatMessage,
  RbicekHostBridge,
  RbicekRuntimeConfig,
  RbicekTheme,
  StoredConversation,
} from '@/lib/rbicek/types';
import { randomId } from '@/lib/rbicek/utils';
import type { Locale } from '@/contexts/LanguageContext';

export interface UseRbicekChatParams {
  visible: boolean;
  locale: Locale;
  theme: RbicekTheme;
  accentColor: string;
  isLoggedIn: boolean;
  userToken?: string | null;
  userId?: string | null;
  userDisplayName?: string | null;
  bridge: RbicekHostBridge;
}

export function useRbicekChat(params: UseRbicekChatParams) {
  const { visible, locale, theme, accentColor, isLoggedIn, userToken, userId, userDisplayName, bridge } =
    params;

  const config: RbicekRuntimeConfig = {
    locale,
    theme,
    accentColor,
    platform: 'app',
    isLoggedIn,
    userToken,
    userId,
    userDisplayName,
    webBaseUrl: RBICEK_WEB_BASE_URL,
    apiBaseUrl: 'https://crm.xrb.cz',
    supportBaseUrl: RBICEK_SUPPORT_BASE_URL,
    supportPublicKey: RBICEK_PUBLIC_KEY,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState(getStartNodeId(isLoggedIn));
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => randomId('conv'));
  const supportSessionRef = useRef<{ conversationId: string; token: string } | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  const persist = useCallback(
    async (nextMessages: ChatMessage[], nodeId: string, convId: string) => {
      const stored: StoredConversation = {
        id: convId,
        messages: nextMessages,
        currentNodeId: nodeId,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        chatMode: 'flow',
        serverConversationId: supportSessionRef.current?.conversationId,
        supportToken: supportSessionRef.current?.token,
      };
      await saveStoredConversation(stored);
    },
    []
  );

  const syncTranscript = useCallback((nextMessages: ChatMessage[]) => {
    const session = supportSessionRef.current;
    if (!session) return;
    const lines = nextMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));
    void syncSupportTranscript(session, lines);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!visible) return;
    idleTimerRef.current = setTimeout(() => {
      setMessages((prev) => {
        const reminder = buildIdleReminder(config);
        const next = [...expireLatestChips(prev), reminder];
        void persist(next, 'idle_reminder', conversationId);
        return next;
      });
    }, RBICEK_IDLE_REMINDER_MS);
  }, [visible, config, persist, conversationId]);

  const startFresh = useCallback(async () => {
    const startId = getStartNodeId(isLoggedIn);
    const convId = randomId('conv');
    const welcome = buildWelcomeMessage(config);
    setConversationId(convId);
    setCurrentNodeId(startId);
    setMessages([welcome]);
    await persist([welcome], startId, convId);
    resetIdleTimer();
  }, [config, isLoggedIn, persist, resetIdleTimer]);

  useEffect(() => {
    if (!visible || initializedRef.current) return;
    if (__DEV__) {
      console.info(
        `[Rbicek] flow snapshot v${flowSnapshotMeta.version} (${flowSnapshotMeta.generatedAt})`
      );
    }
    initializedRef.current = true;
    void (async () => {
      const stored = await loadStoredConversation();
      const session = await openPassiveSupportSession(RBICEK_PUBLIC_KEY, locale);
      if (session) supportSessionRef.current = session;

      if (stored?.messages.length) {
        setConversationId(stored.id);
        setCurrentNodeId(stored.currentNodeId);
        setMessages(stored.messages);
        if (stored.serverConversationId && stored.supportToken) {
          supportSessionRef.current = {
            conversationId: stored.serverConversationId,
            token: stored.supportToken,
          };
        }
      } else {
        await startFresh();
      }
      resetIdleTimer();
    })();
  }, [visible, locale, startFresh, resetIdleTimer]);

  useEffect(() => {
    if (!visible) {
      initializedRef.current = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
  }, [visible]);

  const selectOption = useCallback(
    async (optionId: string) => {
      setIsLoading(true);
      try {
        const result = await processOptionSelection({
          optionId,
          currentNodeId,
          messages,
          config,
          bridge,
        });
        if (!result) return;

        if (result.openSupportChannels) {
          bridge.openSupportChannels();
        }

        setMessages(result.messages);
        setCurrentNodeId(result.currentNodeId);
        void persist(result.messages, result.currentNodeId, conversationId);
        syncTranscript(result.messages);
        resetIdleTimer();

        if (result.closeAndOpenReservations) {
          bridge.closeChat();
          bridge.openMyReservations();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentNodeId, messages, config, bridge, persist, conversationId, syncTranscript, resetIdleTimer]
  );

  const navigateToNode = useCallback(
    (nodeId: string, userLabel: string) => {
      const result = processNavigateToNode({ nodeId, userLabel, messages, config });
      if (!result) return;
      setMessages(result.messages);
      setCurrentNodeId(result.currentNodeId);
      void persist(result.messages, result.currentNodeId, conversationId);
      syncTranscript(result.messages);
      resetIdleTimer();
    },
    [messages, config, persist, conversationId, syncTranscript, resetIdleTimer]
  );

  const restartConversation = useCallback(async () => {
    await clearStoredConversation();
    await startFresh();
  }, [startFresh]);

  return {
    messages,
    isLoading,
    selectOption,
    navigateToNode,
    restartConversation,
    config,
  };
}
