export type CrmIsNewEntity = { isNew?: boolean } | null | undefined;

/** CRM posílá `isNew: true` jen pro entity mladší než 30 dní; absence = není nový. */
export function showIsNew(entity: CrmIsNewEntity): boolean {
  return entity?.isNew === true;
}
