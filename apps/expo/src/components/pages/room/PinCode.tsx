import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "expo-router";

import { Action, Button, Popover } from "../../shared";

export const PinCode = () => {
  const { pin } = useSearchParams();
  const { back } = useRouter();

  const [showRoomPopover, setShowRoomPopover] = useState(false);

  const toggleRoomPopover = useCallback(() => {
    setShowRoomPopover((prev) => !prev);
  }, []);

  const goToHome = useCallback(() => {
    toggleRoomPopover();
    back();
  }, []);

  return (
    <>
      <Button
        onPress={toggleRoomPopover}
        className="opacity-60"
        title={pin!}
        variant="text"
        icon="information-circle-outline"
      />
      <Popover visible={showRoomPopover} onRequestClose={toggleRoomPopover}>
        <Action
          title="Leave session"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="arrow-up"
        />
        <Action
          title="Create playlist in spotify"
          subtitle="And keep this fissa's memories"
          inverted
          disabled
          // onPress={createPlaylist}
          // disabled={!currentUser || savingPlaylist}
          icon="musical-note"
        />
        <Action
          // hidden={!isOwner}
          title={"No speakers found"}
          subtitle="Current speaker"
          inverted
          disabled
          icon="headset"
          // onPress={toggleDevicePopover}
        />
      </Popover>
    </>
  );
};
