import BranchDetailScreen from '@/components/branch/BranchDetailScreen';
import StandaloneDetailRoute from '@/components/detail/StandaloneDetailRoute';

export default function BranchDetailRoute() {
  return (
    <StandaloneDetailRoute>
      <BranchDetailScreen />
    </StandaloneDetailRoute>
  );
}
