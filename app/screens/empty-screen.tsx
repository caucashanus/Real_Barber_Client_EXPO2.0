import React from 'react';

import Header from '@/components/Header';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';

const EmptyScreen = () => {
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
