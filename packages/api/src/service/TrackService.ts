import { ServiceWithContext } from "../utils/context";

export class TrackService extends ServiceWithContext {
  byRoomId = async (roomId: string) => {
    return this.db.track.findMany({
      where: { roomId },
      orderBy: { index: "asc" },
    });
  };
}
