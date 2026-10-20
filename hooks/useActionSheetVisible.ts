import { useEffect, useRef } from 'react';
import type { ActionSheetRef } from 'react-native-actions-sheet';

/** Synchronizuje `open` stav s `ref.show()` / `hide()`. */
export function useActionSheetVisible(open: boolean) {
  const ref = useRef<ActionSheetRef>(null);

  useEffect(() => {
    if (open) ref.current?.show();
    else ref.current?.hide();
  }, [open]);

  return ref;
}
