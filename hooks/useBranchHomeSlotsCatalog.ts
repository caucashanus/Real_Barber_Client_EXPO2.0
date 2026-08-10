import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { fetchBranchHomeSlotsCatalog } from '@/utils/fetchBranchHomeSlotsCatalog';
import {
  emptyNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export function useBranchHomeSlotsCatalog() {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const [slotsByBranch, setSlotsByBranch] = useState(emptyNearestBranchSlots());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiToken) {
      setSlotsByBranch(emptyNearestBranchSlots());
      return;
    }

    setLoading(true);
    fetchBranchHomeSlotsCatalog({ apiToken, locale, t, todayIso })
      .then(setSlotsByBranch)
      .catch(() => setSlotsByBranch(emptyNearestBranchSlots()))
      .finally(() => setLoading(false));
  }, [apiToken, locale, t, todayIso]);

  const slotsForBranch = useCallback(
    (internalId: BranchInternalId | null): NearestBranchHomeSlot[] =>
      internalId ? (slotsByBranch[internalId] ?? []) : [],
    [slotsByBranch]
  );

  return { slotsByBranch, slotsForBranch, loading };
}
