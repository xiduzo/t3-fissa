import { api } from "../utils/api";

export const accessTokenSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  for (const fissa of fissas) {
    try {
      console.log(`[${fissa.pin}] refreshing access token`);
      await api.auth.sync.refreshToken.mutate(fissa.pin);
      console.log(`[${fissa.pin}] access token refreshed`);
    } catch (error) {
      console.error(`[${fissa.pin}] access token refresh failed`, error);
    }
  }
};
