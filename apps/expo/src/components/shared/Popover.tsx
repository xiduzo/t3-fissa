import React, { FC, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  ModalProps,
  NativeSyntheticEvent,
  SafeAreaView,
  View,
} from "react-native";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";

import { useSwipe } from "../../hooks";
import { BottomDrawer } from "./BottomDrawer";
import { DraggableView } from "./DraggableView";

export const Popover: FC<Props> = ({ children, onRequestClose, title, ...props }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const animate = useCallback((config?: Partial<Animated.TimingAnimationConfig>) => {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: AnimationSpeed.Instant,
      useNativeDriver: true,
      ...(config ?? {}),
    }).start();
  }, []);

  const close = (event: NativeSyntheticEvent<any>) => {
    animate();
    // Timeout to make the background opaque again
    // Before closing the modal to prevent
    // Weird animation glitches
    setTimeout(() => onRequestClose?.(event), 25);
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

  return (
    <SafeAreaView className="absolute flex-1">
      <Modal {...props} animationType="slide" transparent onRequestClose={close}>
        <View className="h-full justify-end">
          <Animated.View
            onTouchStart={close}
            className="absolute h-full w-full"
            style={{
              backgroundColor: theme[900] + "80",
              opacity: fadeAnimation,
            }}
          />
          <DraggableView onTouchStart={touchStart} onTouchEnd={touchEnd}>
            <BottomDrawer title={title} action={close} style={{ borderRadius: isActive ? 24 : 0 }}>
              {props.visible && children}
            </BottomDrawer>
          </DraggableView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

interface Props extends Omit<ModalProps, "style"> {
  title?: JSX.Element;
}
