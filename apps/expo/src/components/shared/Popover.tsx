import React, { useCallback, useEffect, useRef, type FC } from "react";
import {
  Animated,
  Modal,
  SafeAreaView,
  View,
  type ModalProps,
  type NativeSyntheticEvent,
  type NativeTouchEvent,
} from "react-native";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";

import { useSwipe } from "../../hooks";
import { BottomDrawer } from "./BottomDrawer";
import { DraggableView } from "./DraggableView";

export const Popover: FC<Props> = ({ children, onRequestClose, ...props }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (config?: Partial<Animated.TimingAnimationConfig>) => {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: AnimationSpeed.VeryFast,
        useNativeDriver: true,
        ...(config ?? {}),
      }).start();
    },
    [fadeAnimation],
  );

  const close = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const isSwipeEvent = !event.nativeEvent.touches.length;
    const duration = isSwipeEvent ? AnimationSpeed.Instant : AnimationSpeed.VeryFast;
    animate({ duration });
    setTimeout(() => onRequestClose?.(event), duration);
  };

  const { touchStart, touchEnd, isActive } = useSwipe({
    onSwipeDown: close,
  });

  useEffect(() => {
    props.visible
      ? animate({ toValue: 1, duration: AnimationSpeed.Normal, delay: 250 })
      : animate();

    return animate;
  }, [props.visible, animate]);

  // TODO: set accessibility focus when visible like toaster
  return (
    <SafeAreaView>
      <Modal {...props} animationType="slide" transparent onRequestClose={close}>
        <View className="h-full justify-end">
          <Animated.View
            onTouchStart={close}
            className="h-full w-full"
            style={{
              backgroundColor: theme[900] + "80",
              opacity: fadeAnimation,
            }}
          />
          <DraggableView onTouchStart={touchStart} onTouchEnd={touchEnd}>
            <BottomDrawer action={close} style={{ borderRadius: isActive ? 24 : 0 }}>
              {children}
            </BottomDrawer>
          </DraggableView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

type Props = Omit<ModalProps, "style">;
