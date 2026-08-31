export {
  RBICEK_PUBLIC_KEY as CUSTOMERAI_PUBLIC_KEY,
  RBICEK_SUPPORT_BASE_URL as CUSTOMERAI_WIDGET_HOST,
  isRbicekEnabled as isCustomerAiEnabled,
} from '@/constants/rbicek';

import { RBICEK_SUPPORT_BASE_URL } from '@/constants/rbicek';

/** Legacy widget script URL — native Rbíček no longer uses WebView. */
export const CUSTOMERAI_WIDGET_SRC = `${RBICEK_SUPPORT_BASE_URL}/widget/v1.js`;
