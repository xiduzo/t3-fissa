import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { type GestureResponderEvent } from "react-native";
import { impactAsync } from "expo-haptics";

export const QuickVoteContext = createContext({
  track: undefined as SpotifyApi.TrackObjectFull | undefined,
  vote: 0,
  setVote: (vote: number): void => {
    console.log("setVote", vote);
  },
  selectTrack: (event: GestureResponderEvent, track?: SpotifyApi.TrackObjectFull): void => {
    console.log("selectTrack", event, track);
  },
  touchStartPosition: {
    current: 0,
  },
});

export const QuickVoteProvider: FC<PropsWithChildren> = ({ children }) => {
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull>();
  const [vote, setVote] = useState(0);
  const touchStartPosition = useRef(0);

  const newVote = useCallback(
    (next: number) => (prev: number) => {
      if (prev !== next) impactAsync().catch(console.warn);
      return next;
    },
    [],
  );

  const handleSetVote = useCallback(
    (vote: number) => {
      setVote(newVote(vote));
    },
    [newVote],
  );

  const handleSelectTrack = useCallback(
    (event: GestureResponderEvent, track?: SpotifyApi.TrackObjectFull) => {
      setTrack(track);
      touchStartPosition.current = event.nativeEvent.pageY;
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      track,
      vote,
      setVote: handleSetVote,
      selectTrack: handleSelectTrack,
      touchStartPosition,
    }),
    [track, vote, handleSetVote, handleSelectTrack, touchStartPosition],
  );

  return <QuickVoteContext.Provider value={contextValue}>{children}</QuickVoteContext.Provider>;
};
