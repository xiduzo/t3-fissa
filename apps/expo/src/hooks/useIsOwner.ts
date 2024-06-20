import { useAuth } from "../providers";
import { api } from "../utils";

export const useIsOwner = (pin: string) => {
  const { data } = api.auth.getUserFissa.useQuery();

  const { user } = useAuth()

  const isSuperAdmin = ["11102251084", "1112978801"].includes(user?.id ?? "")

  return data?.hostOf?.pin === pin || isSuperAdmin;
};
