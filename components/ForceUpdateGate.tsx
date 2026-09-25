import React from 'react';
import { View } from 'react-native';

import ForceUpdateScreen from '@/components/ForceUpdateScreen';
import SiteLoadingState from '@/components/SiteLoadingState';
import { useMobileCompatibilityGate } from '@/hooks/useMobileCompatibilityGate';

interface ForceUpdateGateProps {
  children: React.ReactNode;
}

export default function ForceUpdateGate({ children }: ForceUpdateGateProps) {
  const { phase, blocked, storeUrl } = useMobileCompatibilityGate();

  if (phase === 'checking') {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <SiteLoadingState layout="page" />
      </View>
    );
  }

  if (blocked) {
    return <ForceUpdateScreen storeUrl={storeUrl} />;
  }

  return <>{children}</>;
}
