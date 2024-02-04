import { toast as toastify, ToastContainer as ToastifyContainer } from "react-toastify";
import { Toaster, type ToasterProps } from "@fissa/utils";

import "react-toastify/dist/ReactToastify.css";

import { useTheme } from "~/providers/ThemeProvider";

const AUTO_CLOSE_TIME_MS = 15000;

class NextToast extends Toaster {
  protected show({ type = "success", message, duration, icon }: ToasterProps) {
    console.log("showing toast", message, duration, icon);
    toastify(message, {
      icon: <>{icon ?? this.defaultIcon(type)}</>,
      autoClose: duration ?? AUTO_CLOSE_TIME_MS,
      type,
      theme: "dark",
    });
  }

  public hide() {
    toastify.dismiss();
  }
}

const toast = new NextToast();

export { toast };

export const ToastContainer = () => {
  const { theme } = useTheme();

  return (
    <ToastifyContainer
      position="bottom-right"
      autoClose={AUTO_CLOSE_TIME_MS}
      hideProgressBar
      closeButton={false} // TODO: Add close button with theme styling
      toastStyle={{
        backgroundColor: theme["100"],
        color: theme["900"],
      }}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};
