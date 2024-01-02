import { RefetchInterval, type QueryCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.fissa.byId.useQuery;

export const useGetFissa = (pin: string, callbacks: QueryCallbacks<typeof endpoint> = {}) => {
  return endpoint(pin, {
    enabled: !!pin,
    refetchInterval: RefetchInterval.Normal,
    onError: (error) => {
      callbacks.onError?.(error);
    },
    onSuccess: (data) => {
      callbacks.onSuccess?.(data);
    },
  });
};

export const useGetFissaDetails = (pin: string, refetchInterval = RefetchInterval.Normal) => {
  return endpoint(pin, {
    refetchInterval,
    enabled: !!pin,
  });
};
