import { api } from "./api";

export const useInvalidateFissa = () => {
  const queryClient = api.useContext();

  return queryClient.fissa.byId.invalidate;
};
