import BarberDetailScreen from '@/components/barber/BarberDetailScreen';
import StandaloneDetailRoute from '@/components/detail/StandaloneDetailRoute';

export default function BarberDetailRoute() {
  return (
    <StandaloneDetailRoute>
      <BarberDetailScreen />
    </StandaloneDetailRoute>
  );
}
