import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { useGetUserFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { randomSort, useSpotify } from "@fissa/utils";

import { Button, PageTemplate, Popover, Typography } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";
import { toast } from "../../src/utils";

const Host = () => {
  const spotify = useSpotify();

  const { mutateAsync, isLoading } = useCreateFissa();

  const handleSurpriseMe = useCallback(async () => {
    toast.info({
      icon: "🦔",
      message: "An explorer I see, making a fissa just for you",
      duration: 5000,
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
  }, [spotify]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <HostOfFissaWarning />
      <PageTemplate>
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
    </SafeAreaView>
  );
};

export default Host;

const HostOfFissaWarning = () => {
  const { data } = useGetUserFissa();
  const [isWarningVisible, setIsWarningVisible] = useState(!!data?.hostOf);

  return (
    <Popover visible={isWarningVisible} onRequestClose={() => setIsWarningVisible(false)}>
      <Typography centered className="text-7xl" variant="h1">
        🐟
      </Typography>
      <Typography variant="h1" centered className="my-2" inverted>
        It seems like you forgot that are already hosting a Fissa
      </Typography>
      <Typography variant="bodyL" className="mb-8" centered inverted>
        Hosting a new Fissa will stop Fissa {data?.hostOf?.pin}!
      </Typography>
      <Button
        inverted
        className="mb-4"
        title={`Rejoin Fissa ${data?.hostOf?.pin}`}
        onPress={() => setIsWarningVisible(false)}
        linkTo={`/fissa/${data?.hostOf?.pin}`}
      />
      <Button
        inverted
        onPress={() => setIsWarningVisible(false)}
        variant="text"
        title="Roger that, I want a new Fissa"
      />
    </Popover>
  );
};
