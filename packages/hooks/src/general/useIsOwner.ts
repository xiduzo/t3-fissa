import { useGetUserFissa } from "../api/useGetUserFissa";

export const useIsOwner = (pin: string) => {
  const { data } = useGetUserFissa();
  return data?.hostOf?.pin === pin;
};
