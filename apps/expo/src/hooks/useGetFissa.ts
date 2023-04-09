import { api } from "../utils";

export const useGetFissa = (pin: string) => {
  return api.fissa.byId.useQuery(pin, {
    refetchInterval: 2500,
    enabled: !!pin,
  });
};

export const useGetFissaDetails = (pin: string) => {
  return api.fissa.detailsById.useQuery(pin, {
    refetchInterval: 2500,
    enabled: !!pin,
  });
};
