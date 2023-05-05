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

// TODO: move to @fissa/utils ?
export const mapSpotifyTrackToTrpcTrack = (
  track: SpotifyApi.TrackObjectFull,
) => ({
  trackId: track.id,
  durationMs: track.duration_ms,
});
