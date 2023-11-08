import {
  createContext,
  useCallback,
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
  setVote: (vote: number) => {},
  selectTrack: (event: GestureResponderEvent, track?: SpotifyApi.TrackObjectFull) => {},
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

  return (
    <QuickVoteContext.Provider
      value={{
        track,
        vote,
        setVote: handleSetVote,
        selectTrack: handleSelectTrack,
        touchStartPosition,
      }}
    >
      {children}
    </QuickVoteContext.Provider>
  );
};
