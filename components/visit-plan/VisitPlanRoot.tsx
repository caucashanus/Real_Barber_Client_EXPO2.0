import React, { type ReactNode } from 'react';

import { VisitPlanProvider } from '@/contexts/VisitPlanContext';

export default function VisitPlanRoot({ children }: { children: ReactNode }) {
  return <VisitPlanProvider>{children}</VisitPlanProvider>;
}
