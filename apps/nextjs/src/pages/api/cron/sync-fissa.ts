import { NextApiRequest, NextApiResponse } from "next";
import { addSeconds, differenceInMilliseconds, logger } from "@fissa/utils";

import { api } from "~/utils/api";

export const maxDuration = 60;

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const { data } = api.fissa.sync.active.useQuery();
  const { mutateAsync } = api.fissa.sync.next.useMutation();

  if (!data?.length) {
    res.status(204).json({ name: "No fissa needed to be synced" });
    return res.end();
  }

  const promises: Promise<string>[] = [];

  for (const fissa of data) {
    try {
      // -X seconds to be safe because we check if the user is still listening
      // in spotify anything before playing the next track.
      // The service will account for this difference
      const endTime = addSeconds(fissa.expectedEndTime, -5);
      const delay = differenceInMilliseconds(endTime, new Date());

      if (delay >= maxDuration * 1000) continue;

      logger.debug(`${fissa.pin}, next track in ${delay}ms`);

      const promise = new Promise<string>((resolve) => {
        setTimeout(() => {
          mutateAsync(fissa.pin).finally(() => resolve(fissa.pin));
        }, delay);
      });

      promises.push(promise);
    } catch (error) {
      console.error(`${fissa.pin}, next track failed`, error);
    }
  }

  await Promise.allSettled(promises);

  res.status(200).json({ name: "Sync fissa" });
  res.end();
}
