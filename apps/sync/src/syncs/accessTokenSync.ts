import { api } from "../utils/api";

export const accessTokenSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  for (const fissa of fissas) {
    try {
      console.log(`refreshing access token for ${fissa.pin}...`);
      await api.auth.sync.refreshToken.mutate(fissa.pin);
      console.log(`access token refreshed for ${fissa.pin}`);
    } catch (error) {
      console.error(`access token refresh failed for ${fissa.pin}`, error);
    }
  }
};
