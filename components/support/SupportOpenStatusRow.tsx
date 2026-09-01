import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import type { TranslationKey } from '@/locales';

/** Sdílený stav živé zákaznické podpory — Kontakty + sheet z Rbíčka. */
export default function SupportOpenStatusRow({
  t,
}: {
  t: (key: TranslationKey) => string;
}) {
  return <BranchOpenStatusRow t={t} variant="operatorSupport" />;
}
