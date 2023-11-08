import { type IconName } from "../components";

export const mapDeviceToIcon = (device?: SpotifyApi.UserDevice): IconName => {
  if (!device) return "question";

  switch (device.type.toLowerCase()) {
    case "computer":
      return "laptop";
    case "smartphone":
      return "smartphone";
    case "castvideo":
    case "castaudio":
      return "cast";
    case "speaker":
    case "avr":
      return "speaker";
    default:
      return "question";
  }
};

// TODO: move to @fissa/utils ?
export const mapSpotifyTrackToTrpcTrack = (
  track: SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified,
) => ({
  trackId: track.id,
  durationMs: track.duration_ms,
});
