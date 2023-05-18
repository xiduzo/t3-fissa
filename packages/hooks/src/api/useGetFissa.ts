import { RefetchInterval } from "@fissa/utils";

import { api } from "./api";

export const useGetFissa = (pin: string, refetchInterval = RefetchInterval.Normal) => {
  return api.fissa.byId.useQuery(pin, {
    refetchInterval,
    enabled: !!pin,
  });
};

export const useGetFissaDetails = (pin: string, refetchInterval = RefetchInterval.Normal) => {
  return api.fissa.detailsById.useQuery(pin, {
    refetchInterval,
    enabled: !!pin,
  });
};
