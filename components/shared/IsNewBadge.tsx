import React from 'react';

import SoftChip from '@/components/shared/SoftChip';
import { useTranslation } from '@/hooks/useTranslation';

/** CRM `isNew === true` — uses global soft chip (overlay on cards, inline on detail). */
export default function IsNewBadge() {
  const { t } = useTranslation();
  return <SoftChip title={t('isNewBadge')} icon="Sparkles" />;
}
