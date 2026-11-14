import { Cake } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';

import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';

const TOOLTIP_MAX_WIDTH = 240;
const TOOLTIP_GAP = 4;
const SCREEN_EDGE = 12;
const ICON_SIZE = 20;

interface EmployeeBirthdayBadgeProps {
  popoverText: string;
}

type AnchorRect = { x: number; y: number; width: number; height: number };

/** Ikona dortu vedle jména + tooltip po kliknutí — stejné na kartách i v detailu. */
export default function EmployeeBirthdayBadge({ popoverText }: EmployeeBirthdayBadgeProps) {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });

  const iconColor = colors.icon;

  const close = useCallback(() => {
    setOpen(false);
    setTooltipSize({ width: 0, height: 0 });
  }, []);

  const toggleTooltip = useCallback(() => {
    if (open) {
      close();
      return;
    }
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }, [close, open]);

  const tooltipWidth = tooltipSize.width > 0 ? tooltipSize.width : TOOLTIP_MAX_WIDTH;
  const tooltipHeight = tooltipSize.height > 0 ? tooltipSize.height : 48;

  const tooltipLeft = (() => {
    if (!anchor) return SCREEN_EDGE;
    const preferred = anchor.x;
    const maxLeft = windowWidth - tooltipWidth - SCREEN_EDGE;
    return Math.min(Math.max(SCREEN_EDGE, preferred), Math.max(SCREEN_EDGE, maxLeft));
  })();

  const tooltipTop = (() => {
    if (!anchor) return 0;
    return anchor.y + anchor.height + TOOLTIP_GAP;
  })();

  return (
    <>
      <View ref={anchorRef} collapsable={false} className="shrink-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={popoverText}
          accessibilityState={{ expanded: open }}
          hitSlop={6}
          onPress={(event) => {
            event.stopPropagation?.();
            toggleTooltip();
          }}
          className="items-center justify-center active:opacity-70">
          <Cake size={ICON_SIZE} color={iconColor} strokeWidth={2} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1" onPress={close} accessibilityLabel={popoverText}>
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: tooltipTop,
              left: tooltipLeft,
              maxWidth: TOOLTIP_MAX_WIDTH,
            }}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <View
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setTooltipSize((prev) =>
                    prev.width === width && prev.height === height ? prev : { width, height }
                  );
                }}>
                <SurfaceCard rounded="2xl" className="px-3 py-2.5">
                  <ThemedText className="text-sm leading-5 text-light-text dark:text-dark-text">
                    {popoverText}
                  </ThemedText>
                </SurfaceCard>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}