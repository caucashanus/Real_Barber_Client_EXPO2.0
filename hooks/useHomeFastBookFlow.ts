import { useCallback, useEffect, useRef, useState } from 'react';

import {
  HOME_FAST_BOOK_SERVICES,
  type HomeFastBookService,
  type HomeFastBookServiceId,
} from '@/constants/homeFastBookServices';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchHomeFastBookNearestSlots,
  type HomeFastBookLoadedSlots,
} from '@/utils/fetchHomeFastBookNearestSlots';
import {
  clearHomeFastBookRestore,
  consumeHomeFastBookRestore,
  saveHomeFastBookRestore,
  type HomeFastBookWhenChoice,
} from '@/utils/homeFastBookRestore';
import { primeHomeFastBookBookingMonitor } from '@/lib/booking/monitor/homeFastBook';
import {
  nearestBranchHomeSlotSelectionKey,
  navigateHomeFastBookLater,
  prepareNearestBranchHomeSlotBooking,
} from '@/utils/homeFastBookBookingNav';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';

export type HomeFastBookFlow = ReturnType<typeof useHomeFastBookFlow>;

export function useHomeFastBookFlow() {
  const { locale } = useLanguage();

  const [servicesOpen, setServicesOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [whenChoice, setWhenChoice] = useState<HomeFastBookWhenChoice>('now');
  const [whenFromHomeList, setWhenFromHomeList] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState<HomeFastBookServiceId | null>(
    null
  );
  const [loadedSlots, setLoadedSlots] = useState<HomeFastBookLoadedSlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<NearestBranchHomeSlot | null>(null);

  const fetchGenerationRef = useRef(0);
  const restoreRanRef = useRef(false);
  const whenFromHomeListRef = useRef(false);
  /** Po homepage Později → Teď + Dál: služby až po onClose when modalu (RN stack). */
  const openServicesAfterWhenCloseRef = useRef(false);

  const resetSlots = useCallback(() => {
    fetchGenerationRef.current += 1;
    setSelectedServiceId(null);
    setLoadedSlots(null);
    setSlotsLoading(false);
    setSlotsError(false);
    setSelectedSlot(null);
  }, []);

  const resetWhenState = useCallback(() => {
    setWhenChoice('now');
    setWhenFromHomeList(false);
    whenFromHomeListRef.current = false;
  }, []);

  const closeAll = useCallback(() => {
    setServicesOpen(false);
    setWhenOpen(false);
    resetWhenState();
    resetSlots();
  }, [resetSlots, resetWhenState]);

  /** Zavře modaly bez clear restore / reset slotů — handoff do booking (modal jinak zůstane nad stackem). */
  const dismissSheetsForHandoff = useCallback(() => {
    setWhenOpen(false);
    setServicesOpen(false);
  }, []);

  const onServicesOpenChange = useCallback(
    (open: boolean) => {
      setServicesOpen(open);
      if (!open) {
        void clearHomeFastBookRestore();
        setWhenOpen(false);
        resetWhenState();
        resetSlots();
      }
    },
    [resetSlots, resetWhenState]
  );

  const openServicesAfterWhenSheet = useCallback(() => {
    openServicesAfterWhenCloseRef.current = false;
    whenFromHomeListRef.current = false;
    setWhenFromHomeList(false);
    setServicesOpen(true);
  }, []);

  const onWhenOpenChange = useCallback(
    (open: boolean) => {
      setWhenOpen(open);
      if (!open) {
        if (openServicesAfterWhenCloseRef.current) {
          openServicesAfterWhenSheet();
        }
        resetWhenState();
      }
    },
    [openServicesAfterWhenSheet, resetWhenState]
  );

  const openWhenFromList = useCallback(() => {
    whenFromHomeListRef.current = true;
    setWhenFromHomeList(true);
    setWhenChoice('later');
    setWhenOpen(true);
  }, []);

  const openWhenFromPill = useCallback(() => {
    whenFromHomeListRef.current = false;
    setWhenFromHomeList(false);
    setWhenOpen(true);
  }, []);

  const selectService = useCallback(
    (service: HomeFastBookService, options?: { selectSlotKey?: string }) => {
      const generation = ++fetchGenerationRef.current;
      setSelectedServiceId(service.id);
      setSelectedSlot(null);
      setSlotsError(false);
      setLoadedSlots(null);
      setSlotsLoading(true);

      void fetchHomeFastBookNearestSlots(service, locale)
        .then((result) => {
          if (generation !== fetchGenerationRef.current) return;
          setLoadedSlots(result);
          setSlotsError(false);
          const slotKey = options?.selectSlotKey?.trim();
          if (slotKey) {
            const match = result.slots.find(
              (s) => nearestBranchHomeSlotSelectionKey(s) === slotKey
            );
            if (match) setSelectedSlot(match);
          }
        })
        .catch(() => {
          if (generation !== fetchGenerationRef.current) return;
          setSlotsError(true);
          setLoadedSlots(null);
        })
        .finally(() => {
          if (generation !== fetchGenerationRef.current) return;
          setSlotsLoading(false);
        });
    },
    [locale]
  );

  const onServicePress = useCallback(
    (service: HomeFastBookService) => {
      if (selectedServiceId === service.id) {
        resetSlots();
        return;
      }
      selectService(service);
    },
    [resetSlots, selectService, selectedServiceId]
  );

  const selectedService =
    selectedServiceId != null
      ? HOME_FAST_BOOK_SERVICES.find((s) => s.id === selectedServiceId)
      : undefined;

  const listServices =
    selectedServiceId != null && selectedService
      ? [selectedService]
      : HOME_FAST_BOOK_SERVICES;

  const confirmSelectedSlot = useCallback(async () => {
    if (!selectedSlot || !loadedSlots || selectedServiceId == null) return;
    primeHomeFastBookBookingMonitor({ mode: 'nearest', path: 'sheet-slot' });
    await saveHomeFastBookRestore({
      selectedServiceId,
      selectedSlotKey: nearestBranchHomeSlotSelectionKey(selectedSlot),
      whenChoice,
    });
    dismissSheetsForHandoff();
    await prepareNearestBranchHomeSlotBooking(selectedSlot, {
      serviceId: loadedSlots.serviceId,
      serviceName: loadedSlots.serviceName,
    });
  }, [dismissSheetsForHandoff, loadedSlots, selectedServiceId, selectedSlot, whenChoice]);

  const confirmWhen = useCallback(() => {
    if (whenChoice === 'later') {
      primeHomeFastBookBookingMonitor({
        mode: 'later',
        path: whenFromHomeListRef.current ? 'lista-pill-pozdeji' : 'sheet-cas',
      });
      navigateHomeFastBookLater(selectedService ?? null);
      closeAll();
      return;
    }
    if (whenFromHomeListRef.current) {
      openServicesAfterWhenCloseRef.current = true;
      setWhenOpen(false);
      setTimeout(() => {
        if (!openServicesAfterWhenCloseRef.current) return;
        openServicesAfterWhenSheet();
        resetWhenState();
      }, 450);
      return;
    }
    setWhenOpen(false);
  }, [closeAll, openServicesAfterWhenSheet, resetWhenState, selectedService, whenChoice]);

  const goBackServices = useCallback(() => {
    if (selectedServiceId != null) {
      resetSlots();
      return;
    }
    void clearHomeFastBookRestore();
    closeAll();
  }, [closeAll, resetSlots, selectedServiceId]);

  useEffect(() => {
    if (restoreRanRef.current) return;
    restoreRanRef.current = true;
    void (async () => {
      const payload = await consumeHomeFastBookRestore();
      if (!payload) return;
      const service = HOME_FAST_BOOK_SERVICES.find((s) => s.id === payload.selectedServiceId);
      if (!service) return;
      setWhenChoice(payload.whenChoice);
      setServicesOpen(true);
      selectService(service, { selectSlotKey: payload.selectedSlotKey });
    })();
  }, [selectService]);

  const selectedSlotKey =
    selectedSlot != null ? nearestBranchHomeSlotSelectionKey(selectedSlot) : null;

  return {
    servicesOpen,
    whenOpen,
    whenChoice,
    setWhenChoice,
    whenOpenFromList: whenOpen && whenFromHomeList,
    openServices: () => setServicesOpen(true),
    openWhenFromList,
    openWhenFromPill,
    onServicesOpenChange,
    onWhenOpenChange,
    confirmWhen,
    goBackServices,
    listServices,
    selectedServiceId,
    onServicePress,
    slotsLoading,
    slotsError,
    loadedSlots,
    selectedSlotKey,
    setSelectedSlot,
    confirmSelectedSlot,
    dismissSheetsForHandoff,
  };
}
