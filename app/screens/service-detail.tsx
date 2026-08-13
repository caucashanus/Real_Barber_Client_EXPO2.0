import { Redirect, useLocalSearchParams } from 'expo-router';

import { SERVICE_DETAIL_ROUTE } from '@/constants/profileDetailRoutes';

export default function ServiceDetailRedirect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  if (!id) {
    return <Redirect href={SERVICE_DETAIL_ROUTE} />;
  }

  return <Redirect href={`${SERVICE_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`} />;
}
