import React from 'react';

import useThemeColors from '@/app/contexts/ThemeColors';
import Header from '@/components/Header';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';

const EmptyScreen = () => {
  const colors = useThemeColors();

  return (
    <>
      <Header title=" " showBackButton />
      <ThemedScroller className="flex-1 pt-8" keyboardShouldPersistTaps="handled">
        <></>
      </ThemedScroller>
      <ThemedFooter>
        <></>
      </ThemedFooter>
    </>
  );
};

export default EmptyScreen;
