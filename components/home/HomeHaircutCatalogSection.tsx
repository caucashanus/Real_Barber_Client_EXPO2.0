import React, { useMemo } from 'react';

import type { Locale } from '@/contexts/LanguageContext';
import HaircutInspirationCarousel from '@/components/services/HaircutInspirationCarousel';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { buildHomePopularHaircutChips } from '@/constants/homePopularHaircutChips';
import { getHaircutCarouselItems } from '@/utils/publicServicesPageHelpers';
import HomeSectionChipRow from '@/components/home/HomeSectionChipRow';

interface HomeHaircutCatalogSectionProps {
  locale: Locale;
  t: (key: TranslationKey) => string;
  className?: string;
}

export default function HomeHaircutCatalogSection({
  locale,
  t,
  className = '',
}: HomeHaircutCatalogSectionProps) {
  const chips = useMemo(() => buildHomePopularHaircutChips(locale, t), [locale, t]);
  const carouselItems = useMemo(() => getHaircutCarouselItems(locale), [locale]);

  return (
    <Section title={t('servicesPageHaircutInspiration')} titleSize="lg" className={className}>
      <HomeSectionChipRow chips={chips} className="mt-0" />
      <HaircutInspirationCarousel items={carouselItems} />
    </Section>
  );
}
