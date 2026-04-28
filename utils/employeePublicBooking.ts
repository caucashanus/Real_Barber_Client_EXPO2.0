/**
 * Zaměstnanec smí být ve veřejném rezervačním flow, pokud je aktivní
 * a API nezakáže rezervace (EmployeeItemPrice / publicly bookable flags).
 *
 * Podporuje několik možných názvů polí z CRM; chybějící flag = true (zpětná kompatibilita).
 */
export function isEmployeePubliclyBookable(employee: {
  isActive?: boolean;
  [key: string]: unknown;
}): boolean {
  if (employee.isActive === false) return false;

  const raw =
    employee.isEmployeePubliclyBookable ??
    employee.is_employee_publicly_bookable ??
    employee.publiclyBookable ??
    employee.isPubliclyBookable ??
    employee.bookableOnline ??
    employee.isBookableOnline;

  if (raw === undefined || raw === null) return true;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return true;
}
