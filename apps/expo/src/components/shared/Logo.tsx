import { FC } from "react";
import { Animated, RegisteredStyle, StyleSheet, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import { theme } from "@fissa/tailwind-config";

export const Logo: FC<Props> = ({ viewStyle, ...props }) => {
  const style = [viewStyle, styles.commonStyling];

  switch (theme.name) {
    case "blueey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_blueey.json")}
            {...props}
          />
        </Animated.View>
      );
    case "pinkey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_pinkey.json")}
            style={{ zIndex: -1 }}
            {...props}
          />
        </Animated.View>
      );
    case "greeny":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_greeny.json")}
            {...props}
          />
        </Animated.View>
      );
    case "limey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_limey.json")}
            {...props}
          />
        </Animated.View>
      );
    case "sunny":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_sunny.json")}
            {...props}
          />
        </Animated.View>
      );
    // TODO add orangy lottie file
    case "orangy":
    default:
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            source={require("../../../assets/animations/animation_sunny.json")}
            {...props}
          />
        </Animated.View>
      );
  }
};

interface Props {
  viewStyle?:
    | false
    | RegisteredStyle<ViewStyle>
    | Animated.Value
    | Animated.AnimatedInterpolation<string>
    | Animated.WithAnimatedObject<ViewStyle>
    | null
    | undefined;
  progress?: Animated.Value;
}

const styles = StyleSheet.create({
  commonStyling: {
    width: "100%",
    height: "100%",
    zIndex: -100,
    position: "absolute",
  },
});
