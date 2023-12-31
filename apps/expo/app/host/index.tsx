import { useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { randomSort, useSpotify } from "@fissa/utils";

import { Button, PageTemplate, Typography } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";
import { toast } from "../../src/utils";

const Host = () => {
  const spotify = useSpotify();

  const { mutateAsync, isLoading } = useCreateFissa({
    onSettled: () => {
      toast.hide();
    },
  });

  const handleSurpriseMe = useCallback(async () => {
    toast.info({
      icon: "🦔",
      message: "An explorer I see, making a fissa just for you",
      duration: 60 * 1000,
    });
    const { items } = await spotify.getMyTopTracks();
    const { tracks } = await spotify.getRecommendations({
      limit: 5,
      seed_tracks: items
        .map(({ id }) => id)
        .sort(randomSort)
        .slice(0, 5),
    });

    await mutateAsync(tracks);
  }, [spotify, mutateAsync]);

  return (
    <PageTemplate>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View />
      <View>
        <Typography
          variant="h1"
          centered
          className="mb-4"
          accessibilityLabel="Host a fissa, how would you like to start"
        >
          Host a fissa
        </Typography>
        <Typography centered variant="h5" accessibilityElementsHidden>
          how would you like to start
        </Typography>
      </View>
      <View>
        <Button
          title="Based on my playlist"
          className="mb-6"
          linkTo="/host/fromPlaylist"
          disabled={isLoading}
        />
        <Button
          title="Select some songs"
          variant="outlined"
          linkTo="/host/fromTracks"
          disabled={isLoading}
        />
      </View>
      <View>
        <Button
          title="Surprise me"
          variant="text"
          onPress={handleSurpriseMe}
          disabled={isLoading}
        />
      </View>
    </PageTemplate>
  );
};

export default Host;
