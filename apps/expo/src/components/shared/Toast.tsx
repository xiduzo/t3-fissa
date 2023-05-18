import { FC } from "react";
import { Platform, View } from "react-native";
import Toast, { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { theme } from "@fissa/tailwind-config";

import { Typography } from "./Typography";

export const ToastContainer: FC = () => {
  const toastConfig: ToastConfig = {
    success: (props) => <Toaster {...props} />,
    error: (props) => <Toaster {...props} />,
    warning: (props) => <Toaster {...props} />,
    info: (props) => <Toaster {...props} />,
  };

  if (Platform.OS === "android") return null;
  return <Toast config={toastConfig} />;
};

const Toaster: FC<Props> = ({ text1, text2 }) => {
  return (
    <View
      className="mx-auto mt-2 max-w-[95vw] flex-row items-center rounded-xl p-4 shadow-2xl"
      accessibilityRole="alert"
      style={{ backgroundColor: theme["100"] }}
    >
      {text2 && (
        <Typography variant="h1" className="mr-2">
          {text2}
        </Typography>
      )}
      <Typography variant="h6" inverted className="max-w-[90%] flex-grow">
        {text1}
      </Typography>
    </View>
  );
};

interface Props extends ToastConfigParams<any> {
  /**
   * Emoji which is being shown
   */
  text2?: string;
}
