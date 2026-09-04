import React from 'react';

import { DetailScreenLayoutProvider } from '@/contexts/DetailScreenLayoutContext';

interface StandaloneDetailRouteProps {
  children: React.ReactNode;
}

/** Obal pro detail obrazovky otevřené mimo home tab (Oblíbené → /screens/*). */
export default function StandaloneDetailRoute({ children }: StandaloneDetailRouteProps) {
  return <DetailScreenLayoutProvider standalone>{children}</DetailScreenLayoutProvider>;
}
