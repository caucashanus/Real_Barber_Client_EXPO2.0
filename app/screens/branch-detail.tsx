import { Redirect, useLocalSearchParams } from 'expo-router';

import { BRANCH_DETAIL_ROUTE } from '@/constants/profileDetailRoutes';

export default function BranchDetailRedirect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  if (!id) {
    return <Redirect href={BRANCH_DETAIL_ROUTE} />;
  }

  return <Redirect href={`${BRANCH_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`} />;
}
