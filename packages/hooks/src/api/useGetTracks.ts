import { RefetchInterval } from "@fissa/utils";

import { api } from "./api";

export const useGetTracks = (pin: string) => {
  return api.track.byPin.useQuery(pin, {
    enabled: !!pin,
    refetchInterval: RefetchInterval.Lazy,
  });
};
