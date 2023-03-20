import { Platform, ToastAndroid } from "react-native";
import Toast from "react-native-toast-message";

type ToastType = "success" | "warning" | "error" | "info";
export interface ShowProps {
  type?: ToastType;
  icon?: string;
  message: string;
  duration?: number;
}

class Notification {
  defaultIcon(type: ToastType) {
    switch (type) {
      case "error":
        return "🦀";
      case "info":
        return "🦉";
      case "warning":
        return "🦑";
      case "success":
        return "🐕";
      default:
        return "";
    }
  }

  public warn(props: Omit<ShowProps, "type">) {
    this.show({ type: "warning", ...props });
  }

  public success(props: Omit<ShowProps, "type">) {
    this.show({ type: "success", ...props });
  }

  public info(props: Omit<ShowProps, "type">) {
    this.show({ type: "info", ...props });
  }

  public error(props: Omit<ShowProps, "type">) {
    this.show({ type: "error", ...props });
  }

  private show({ type = "success", message, duration, icon }: ShowProps) {
    const text2 = icon ?? this.defaultIcon(type);
    const visibilityTime = duration ?? ToastAndroid.SHORT;

    switch (Platform.OS) {
      case "ios":
      case "macos":
        Toast.show({ type, text1: message, text2, visibilityTime });
        break;
      case "android":
        ToastAndroid.show(message, visibilityTime);
        break;
    }
  }

  public hide() {
    switch (Platform.OS) {
      case "ios":
      case "macos":
        Toast.hide();
        break;
    }
  }
}

const toast = new Notification();

export { toast };
