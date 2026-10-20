const OPERATOR_FLOATING_HIDDEN_ROUTE_PREFIXES = [
  '/screens/reservation-create',
  '/screens/reservation-create-start',
  '/screens/reschedule',
  '/screens/reschedule-summary',
  /** Můj interval — photo intro + setup wizard */
  '/screens/visit-plan-onboarding-intro',
  '/screens/visit-plan-setup',
  '/screens/visit-plan',
  '/screens/visit-plan-calendar',
] as const;

export function shouldHideOperatorFloatingButton(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return OPERATOR_FLOATING_HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** @deprecated Prefer `shouldHideOperatorFloatingButton` — stejné route seznamy. */
export function shouldHideCustomerAiWidget(pathname: string | null | undefined): boolean {
  return shouldHideOperatorFloatingButton(pathname);
}
