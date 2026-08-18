import React from 'react';
import { View } from 'react-native';

import SiteLoadingState from '@/components/SiteLoadingState';

/** Full-screen page bootstrap loader (web SiteLoadingState). */
export default function PageLoader() {
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <SiteLoadingState layout="page" />
    </View>
  );
}
