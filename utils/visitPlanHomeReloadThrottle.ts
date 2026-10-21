/** Min. interval mezi silent reload plánu na home (focus / refresh). */
export const VISIT_PLAN_HOME_SILENT_RELOAD_MS = 60_000;

export function shouldRunVisitPlanHomeSilentReload(lastAtMs: number, nowMs = Date.now()): boolean {
  if (lastAtMs <= 0) return true;
  return nowMs - lastAtMs >= VISIT_PLAN_HOME_SILENT_RELOAD_MS;
}
