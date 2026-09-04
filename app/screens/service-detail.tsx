import StandaloneDetailRoute from '@/components/detail/StandaloneDetailRoute';
import ServiceDetailScreen from '@/components/services/ServiceDetailScreen';

export default function ServiceDetailRoute() {
  return (
    <StandaloneDetailRoute>
      <ServiceDetailScreen />
    </StandaloneDetailRoute>
  );
}
