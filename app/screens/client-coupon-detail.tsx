import { Redirect, useLocalSearchParams } from 'expo-router';

import { promoKuponHref } from '@/constants/promoDetailRoutes';

export default function ClientCouponDetailRedirect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  if (!id) {
    return <Redirect href="/real-barber" />;
  }

  return <Redirect href={promoKuponHref(id)} />;
}
