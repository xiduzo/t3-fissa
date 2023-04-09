import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.fissa.create.useMutation;

export const useCreateFissa = (
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  return endpoint(callbacks);
};
