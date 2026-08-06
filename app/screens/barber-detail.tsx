import { Redirect, useLocalSearchParams } from 'expo-router';

import { BARBER_DETAIL_ROUTE } from '@/constants/profileDetailRoutes';

export default function BarberDetailRedirect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  if (!id) {
    return <Redirect href={BARBER_DETAIL_ROUTE} />;
  }

  return <Redirect href={`${BARBER_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`} />;
}
