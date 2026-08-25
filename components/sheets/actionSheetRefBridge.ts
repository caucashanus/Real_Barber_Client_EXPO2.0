import type { ActionSheetRef } from 'react-native-actions-sheet';

/** Most ref.show() / ref.hide() volající komponenty nepotřebují plné ActionSheetRef API. */
export function createActionSheetRefBridge(
  show: () => void,
  hide: () => void,
  isOpen: () => boolean
): ActionSheetRef {
  return {
    show,
    hide,
    setModalVisible: (visible = true) => {
      if (visible) show();
      else hide();
    },
    snapToOffset: () => {},
    snapToIndex: () => {},
    handleChildScrollEnd: () => {},
    snapToRelativeOffset: () => {},
    currentSnapIndex: () => 0,
    modifyGesturesForLayout: () => {},
    isGestureEnabled: () => true,
    isOpen,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ev: {} as any,
    keyboardHandler: () => {},
  };
}
