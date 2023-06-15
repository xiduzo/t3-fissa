import { RefetchInterval } from "@fissa/utils";

import { api } from "./api";

export const useGetUserFissa = () => {
  return api.auth.getUserFissa.useQuery(undefined, {
    refetchInterval: RefetchInterval.Normal,
  });
};
