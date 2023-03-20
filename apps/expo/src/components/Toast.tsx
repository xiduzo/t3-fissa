import { FC } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast, {
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";

import { Typography } from "./Typography";

interface ToastProps extends ToastConfigParams<any> {
  /**
   * Emoji which is being shown
   */
  text2?: string;
}

const Toaster: FC<ToastProps> = ({ text1, text2 }) => {
  return (
    <View
      className="mx-2 mt-2 flex flex-row items-center rounded-xl bg-theme-100 p-4 shadow-2xl"
      accessibilityRole="alert"
    >
      {text2 && (
        <Typography variant="h1" className="mr-2">
          {text2}
        </Typography>
      )}
      <Typography variant="h6" inverted className="flex-grow">
        {text1}
      </Typography>
    </View>
  );
};

const ToastContainer: FC = () => {
  const toastConfig: ToastConfig = {
    success: (props) => <Toaster {...props} />,
    error: (props) => <Toaster {...props} />,
    warning: (props) => <Toaster {...props} />,
    info: (props) => <Toaster {...props} />,
  };

  if (Platform.OS === "android") return null;
  return <Toast config={toastConfig} />;
};

export default ToastContainer;

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     alignItems: "center",

//     marginVertical: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     width: "95%",
//     backgroundColor: Color.light,
//     marginTop: 24,
//     borderRadius: 16,
//     shadowColor: Color.dark,
//     shadowOpacity: 1,
//     shadowRadius: 16,
//     shadowOffset: {
//       height: 16,
//       width: 0,
//     },
//   },
//   emoji: {
//     fontSize: 24,
//     marginRight: 16,
//   },
//   text: {
//     maxWidth: "87.5%",
//     flexGrow: 1,
//   },
// });
