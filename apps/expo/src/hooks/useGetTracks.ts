import { api } from "../utils";

export const useGetTracks = (pin: string) => {
  return api.track.byPin.useQuery(pin, {
    enabled: !!pin,
    refetchInterval: 60 * 1000,
  });
};
