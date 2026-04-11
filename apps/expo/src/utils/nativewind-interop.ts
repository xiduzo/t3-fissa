import { Animated } from "react-native";
 
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

// Register third-party components with NativeWind v4
// so they can accept the className prop
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
cssInterop(LinearGradient, { className: "style" });
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
cssInterop(Animated.View, { className: "style" });
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
cssInterop(Animated.Text, { className: "style" });
