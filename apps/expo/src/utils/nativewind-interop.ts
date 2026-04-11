import { Animated } from "react-native";
 
import { styled } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

// Register third-party components with NativeWind v5
// so they can accept the className prop
styled(LinearGradient, { className: "style" });
styled(Animated.View, { className: "style" });
styled(Animated.Text, { className: "style" });
