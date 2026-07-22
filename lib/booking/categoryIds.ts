/** CRM service category UUIDs — parity with web booking wizard. */

export const SERVICES_CATEGORY_ID = '75ea9af2-e964-4fc3-bf64-443bc49f6469';
export const HAIRSTYLE_CATEGORY_ID = '666a4867-4971-417f-8f54-e0a9017ca7f4';
export const BARVENI_CATEGORY_ID = 'd0a2ccb9-92a9-4780-8e21-c05130dd792d';
export const BALICKY_CATEGORY_ID = 'a0d073fb-df90-4d58-9203-1cb800357a3c';
export const SLUZBY_DOMU_CATEGORY_ID = '2d762482-bbe1-4b11-a86f-0c0ab444c147';

export const BOOKING_SERVICE_ACCORDION_CATEGORY_IDS = [
  BALICKY_CATEGORY_ID,
  HAIRSTYLE_CATEGORY_ID,
] as const;

export function isBookingServiceAccordionCategory(categoryId: string): boolean {
  return (BOOKING_SERVICE_ACCORDION_CATEGORY_IDS as readonly string[]).includes(categoryId);
}
