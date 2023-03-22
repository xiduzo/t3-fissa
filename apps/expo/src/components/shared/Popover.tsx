import React, { FC, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  ModalProps,
  NativeSyntheticEvent,
  SafeAreaView,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";

import { useSwipe } from "../../hooks/useSwipe";
import { BottomDrawer } from "./BottomDrawer";
import { DraggableView } from "./DraggableView";

export interface PopOverProps extends Omit<ModalProps, "style"> {
  title?: JSX.Element;
}

export const Popover: FC<PopOverProps> = ({
  children,
  onRequestClose,
  title,
  ...props
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (config?: Partial<Animated.TimingAnimationConfig>) => {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
        ...(config ?? {}),
      }).start();
    },
    [],
  );

  const close = (event: NativeSyntheticEvent<any>) => {
    animate();
    onRequestClose && onRequestClose(event);
  };

  const { touchStart, touchEnd, isActive } = useSwipe({
    onSwipeDown: close,
  });

  useEffect(() => {
    props.visible
      ? animate({ toValue: 1, duration: 300, delay: 250 })
      : animate();

    return animate;
  }, [props.visible, animate]);

  return (
    <SafeAreaView className="absolute flex-1">
      <Modal
        animationType="slide"
        transparent
        {...props}
        onRequestClose={close}
      >
        <View className="h-full justify-end">
          <DraggableView onTouchStart={touchStart} onTouchEnd={touchEnd}>
            <BottomDrawer
              title={title}
              action={close}
              style={{ borderRadius: isActive ? 24 : 0 }}
            >
              {children}
            </BottomDrawer>
          </DraggableView>
          {fadeAnimation && (
            <Animated.View
              className="absolute inset-0 -z-10"
              style={{ opacity: fadeAnimation }}
            >
              <LinearGradient
                onTouchStart={close}
                colors={[theme[900] + "80", theme[900] + "80"]}
                className="absolute inset-0 -z-10"
              />
            </Animated.View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};
