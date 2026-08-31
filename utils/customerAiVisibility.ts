const CUSTOMERAI_HIDDEN_ROUTE_PREFIXES = [
  '/screens/reservation-create',
  '/screens/reservation-create-start',
  '/screens/reschedule',
  '/screens/reschedule-summary',
] as const;

export function shouldHideCustomerAiWidget(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return CUSTOMERAI_HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
