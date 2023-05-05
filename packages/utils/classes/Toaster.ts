export class Toaster {
  protected defaultIcon(type: ToastType) {
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

  public warn(props: Omit<ToasterProps, "type">) {
    this.show({ type: "warning", ...props });
  }

  public success(props: Omit<ToasterProps, "type">) {
    this.show({ type: "success", ...props });
  }

  public info(props: Omit<ToasterProps, "type">) {
    this.show({ type: "info", ...props });
  }

  public error(props: Omit<ToasterProps, "type">) {
    this.show({ type: "error", ...props });
  }

  protected show(_: ToasterProps) {
    throw new Error("Not implemented");
  }

  public hide() {
    throw new Error("Not implemented");
  }
}

type ToastType = "success" | "warning" | "error" | "info";
export interface ToasterProps {
  type?: ToastType;
  icon?: string;
  message: string;
  duration?: number;
}
