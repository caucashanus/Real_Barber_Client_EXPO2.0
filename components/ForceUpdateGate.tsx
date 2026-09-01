import React from 'react';

import ForceUpdateScreen from '@/components/ForceUpdateScreen';
import { isNativeAppVersionSupported } from '@/utils/appVersionSupport';

interface ForceUpdateGateProps {
  children: React.ReactNode;
}

export default function ForceUpdateGate({ children }: ForceUpdateGateProps) {
  if (!isNativeAppVersionSupported()) {
    return <ForceUpdateScreen />;
  }

  return <>{children}</>;
}
