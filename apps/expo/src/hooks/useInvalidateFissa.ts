import { api } from "../utils";

export const useInvalidateFissa = () => {
  const queryClient = api.useContext();

  return queryClient.fissa.byId.invalidate;
};
