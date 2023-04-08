import { api } from "../utils/api";

export const accessTokenSync = async () => {
  const rooms = await api.room.sync.active.query();

  for (const room of rooms) {
    try {
      console.log(`refreshing access token for ${room.pin}...`);
      await api.auth.sync.refreshToken.mutate(room.pin);
      console.log(`access token refreshed for ${room.pin}`);
    } catch (error) {
      console.error(`access token refresh failed for ${room.pin}`, error);
    }
  }
};
