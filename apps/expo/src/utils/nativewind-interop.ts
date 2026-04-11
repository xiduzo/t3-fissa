import { Animated } from "react-native";
 
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

// Register third-party components with NativeWind v4
// so they can accept the className prop
cssInterop(LinearGradient, { className: "style" });
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });
