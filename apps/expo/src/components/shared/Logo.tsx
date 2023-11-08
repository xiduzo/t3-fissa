import { type FC } from "react";
import { Animated, StyleSheet, type RegisteredStyle, type ViewStyle } from "react-native";
import LottieView, { type AnimationObject } from "lottie-react-native";
import { theme } from "@fissa/tailwind-config";

type Source =
  | string
  | AnimationObject
  | {
      uri: string;
    };
export const Logo: FC<Props> = ({ viewStyle, ...props }) => {
  const style = [viewStyle, styles.commonStyling];

  switch (theme.name) {
    case "blueey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            source={require("../../../assets/animations/animation_blueey.json") as Source}
            {...props}
          />
        </Animated.View>
      );
    case "pinkey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            source={require("../../../assets/animations/animation_pinkey.json") as Source}
            style={{ zIndex: -1 }}
            {...props}
          />
        </Animated.View>
      );
    case "greeny":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            source={require("../../../assets/animations/animation_greeny.json") as Source}
            {...props}
          />
        </Animated.View>
      );
    case "limey":
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            source={require("../../../assets/animations/animation_limey.json") as Source}
            {...props}
          />
        </Animated.View>
      );
    case "orangy": // TODO add orangy lottie file
    case "sunny":
    default:
      return (
        <Animated.View style={style} aria-hidden={true}>
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            source={require("../../../assets/animations/animation_sunny.json") as Source}
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
