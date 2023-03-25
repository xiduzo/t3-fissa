import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.room.create.useMutation;

export const useCreateRoom = (
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  return endpoint(callbacks);
};
