import { FontAwesome } from "@expo/vector-icons";

export const mapDeviceToIcon = (
  device?: SpotifyApi.UserDevice,
): keyof typeof FontAwesome.glyphMap => {
  if (!device) return "question";

  switch (device.type.toLowerCase()) {
    case "computer":
      return "laptop";
    case "smartphone":
      return "mobile-phone";
    case "castvideo":
    case "speaker":
      return "bluetooth-b";
    default:
      return "question";
  }
};
