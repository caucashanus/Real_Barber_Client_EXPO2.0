import React from 'react';

import ForceUpdateScreen from '@/components/ForceUpdateScreen';
import { useMobileCompatibilityGate } from '@/hooks/useMobileCompatibilityGate';

interface ForceUpdateGateProps {
  children: React.ReactNode;
}

/** Blokuje zastaralou nativní verzi; kontrola běží na pozadí (bez fullscreen spinneru po cold startu). */
export default function ForceUpdateGate({ children }: ForceUpdateGateProps) {
  const { blocked, storeUrl } = useMobileCompatibilityGate();

  if (blocked) {
    return <ForceUpdateScreen storeUrl={storeUrl} />;
  }

  return <>{children}</>;
}
