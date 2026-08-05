import type { Href } from 'expo-router';

import type { TranslationKey } from '@/locales';

export type BreadcrumbItem = {
  name: string;
  /** Interní route; bez href = aktuální stránka (neklikací). */
  href?: Href;
};

export const BREADCRUMB_BRAND = 'Real Barber';

export const BREADCRUMB_APP_ROUTES = {
  home: '/real-barber' as Href,
  branches: '/branches' as Href,
  services: '/services' as Href,
  team: '/experience' as Href,
  guides: '/guides' as Href,
} as const;

type Translate = (key: TranslationKey) => string;

export function branchBreadcrumbItems(branchName: string, t: Translate): BreadcrumbItem[] {
  return [
    { name: BREADCRUMB_BRAND, href: BREADCRUMB_APP_ROUTES.home },
    { name: t('tabBranches'), href: BREADCRUMB_APP_ROUTES.branches },
    { name: branchName },
  ];
}

export function serviceBreadcrumbItems(serviceName: string, t: Translate): BreadcrumbItem[] {
  return [
    { name: BREADCRUMB_BRAND, href: BREADCRUMB_APP_ROUTES.home },
    { name: t('tabServices'), href: BREADCRUMB_APP_ROUTES.services },
    { name: serviceName },
  ];
}

export function teamMemberBreadcrumbItems(memberName: string, t: Translate): BreadcrumbItem[] {
  return [
    { name: BREADCRUMB_BRAND, href: BREADCRUMB_APP_ROUTES.home },
    { name: t('tabBarbers'), href: BREADCRUMB_APP_ROUTES.team },
    { name: memberName },
  ];
}

export function blogBreadcrumbItems(articleTitle: string, t: Translate): BreadcrumbItem[] {
  return [
    { name: BREADCRUMB_BRAND, href: BREADCRUMB_APP_ROUTES.home },
    { name: t('breadcrumbBlog'), href: BREADCRUMB_APP_ROUTES.guides },
    { name: articleTitle },
  ];
}
