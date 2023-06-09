import { FC } from "react";
import { useGetFissa } from "@fissa/hooks";
import { useDevices } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { Fab } from "../../shared";

export const FissaFab: FC<Props> = ({ pin }) => {
  const { user } = useAuth();
  const { data: fissa } = useGetFissa(String(pin));
  const { activeDevice } = useDevices();

  const isOwner = user?.email === fissa?.by.email;

  if (!isOwner) {
    return <Fab title="add songs" icon="plus" linkTo={`fissa/${pin}/addTracks`} />;
  }

  return null;
};

interface Props {
  pin: string;
}
