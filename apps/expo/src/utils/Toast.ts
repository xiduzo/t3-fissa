import { Toaster, type ToasterProps } from "@fissa/utils";
import { Platform, ToastAndroid } from "react-native";
import Toast from "react-native-toast-message";

class NativeToast extends Toaster {
  private activeId: string | undefined;

  protected show({ type = "success", message, duration, icon, id }: ToasterProps) {
    const text2 = icon ?? this.defaultIcon(type);
    const visibilityTime = duration ?? 1500;
    this.activeId = id;
    switch (Platform.OS) {
      case "ios":
      case "macos":
        return Toast.show({ type, text1: message, text2, visibilityTime });
      case "android":
        return ToastAndroid.show(message, visibilityTime);
    }
  }

  public hide(id?: string) {
    if (id && this.activeId !== id) return;
    this.activeId = undefined;
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
