import { toast as toastify, ToastContainer as ToastifyContainer } from "react-toastify";
import { Toaster, type ToasterProps } from "@fissa/utils";
import { useTheme } from "~/providers/ThemeProvider";

const AUTO_CLOSE_TIME_MS = 5000;

class WebToast extends Toaster {
  protected show({ type = "success", message, duration, icon }: ToasterProps) {
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

const toast = new WebToast();

export { toast };

export const ToastContainer = () => {
  const { theme } = useTheme();

  return (
    <ToastifyContainer
      position="bottom-right"
      autoClose={AUTO_CLOSE_TIME_MS}
      hideProgressBar
      stacked
      closeButton={false}
      toastStyle={{
        backgroundColor: theme["100"],
        color: theme["900"],
      }}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};
