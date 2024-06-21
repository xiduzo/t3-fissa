import { randomSort, useSpotify } from "@fissa/utils";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { Button, ButtonGroup, PageTemplate, Typography } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";
import { toast } from "../../src/utils";

const MAX_SEED_TRACKS = 5;

const Host = () => {
  const spotify = useSpotify();
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync } = useCreateFissa({
    onSettled: () => {
      toast.hide();
      setIsLoading(false)
    },
  });

  const handleSurpriseMe = useCallback(async () => {
    setIsLoading(true)
    toast.info({
      icon: "🦔",
      message: "Explore songs just for you",
      duration: 60 * 1000,
    });
    try {
      const { items } = await spotify.getMyTopTracks();
      const { tracks } = await spotify.getRecommendations({
        limit: 10,
        seed_tracks: items
          .map(({ id }) => id)
          .sort(randomSort)
          .slice(0, MAX_SEED_TRACKS),
      });

      await mutateAsync(tracks);
    } catch (e) {
      toast.error({
        message: "Woops, something went wrong. Try again later.",
      });
    }
  }, [spotify, mutateAsync]);

  return (
    <PageTemplate className="pt-40">
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View>
        <Typography variant="h1" centered className="mb-4">
          Host a fissa
        </Typography>
        <Typography centered variant="h5">
          how would you like to start
        </Typography>
      </View>
      <ButtonGroup>
        <Button title="Based on my playlist" linkTo="/host/fromPlaylist" disabled={isLoading} />
        <Button
          title="Select some songs"
          variant="outlined"
          linkTo="/host/fromTracks"
          disabled={isLoading}
        />
      </ButtonGroup>
      <Button title="Surprise me" variant="text" onPress={handleSurpriseMe} disabled={isLoading} />
    </PageTemplate>
  );
};

export default Host;
