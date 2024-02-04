import { api } from "../utils";

export const useIsOwner = (pin: string) => {
  const { data } = api.auth.getUserFissa.useQuery();
  return data?.hostOf?.pin === pin;
};
