import { Toaster, type ToasterProps } from "@fissa/utils";
import { Platform, ToastAndroid } from "react-native";
import Toast from "react-native-toast-message";

class NativeToast extends Toaster {
  protected show({ type = "success", message, duration, icon }: ToasterProps) {
    const text2 = icon ?? this.defaultIcon(type);
    const visibilityTime = duration ?? 1500;
    switch (Platform.OS) {
      case "ios":
      case "macos":
        return Toast.show({ type, text1: message, text2, visibilityTime });
      case "android":
        return ToastAndroid.show(message, visibilityTime);
    }
  }

  public hide() {
    switch (Platform.OS) {
      case "ios":
      case "macos":
        Toast.hide();
        break;
      case "android":
        // Android does not support hiding toasts
        break;
      default:
      // Do nothing
    }
  }
}

const toast = new NativeToast();

export { toast };
