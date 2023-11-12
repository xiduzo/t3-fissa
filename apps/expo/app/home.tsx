import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import {
  Action,
  Button,
  Divider,
  IconButton,
  PageTemplate,
  Popover,
  Rejoin,
  Typography,
} from "../src/components";
import { useAuth } from "../src/providers";

const Home = () => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          animation: "fade",
          headerRight: HeaderRight,
        }}
      />
      <PageTemplate>
        <View />
        <View>
          <Typography
            variant="h1"
            centered
            className="mb-4"
            accessibilityLabel={`Hi there ${user?.display_name}, what are you up to`}
          >
            Hi there {user?.display_name},
          </Typography>
          <Typography centered variant="h5" accessibilityElementsHidden>
            what are you up to
          </Typography>
        </View>
        <View>
          <Button title="join a fissa" className="mb-6" linkTo="/join" />
          <Button
            title="host a fissa"
            disabled={user?.product !== "premium"}
            variant="outlined"
            linkTo="/host"
          />
          {user?.product !== "premium" && (
            <Typography dimmed centered className="mt-4" variant="bodyM">
              Only spotify premium users can host a fissa
            </Typography>
          )}
        </View>
        <Rejoin />
      </PageTemplate>
    </SafeAreaView>
  );
};

export default Home;

const HeaderRight = () => <AccountDetails />;

const AccountDetails = () => {
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const { signOut, user } = useAuth();

  const toggleAccountDetails = useCallback(() => {
    setShowAccountDetails((prev) => !prev);
  }, []);

  const handleSignOut = useCallback(() => {
    toggleAccountDetails();
    signOut();
  }, [toggleAccountDetails, signOut]);

  return (
    <>
      <IconButton title="account details" icon="user" onPress={toggleAccountDetails} />
      <Popover visible={showAccountDetails} onRequestClose={toggleAccountDetails}>
        <Typography inverted variant="h3" centered>
          {user?.display_name}
        </Typography>
        <Divider />
        <Action
          icon="user"
          title="Sign out"
          subtitle="hasta la vista baby"
          inverted
          onPress={handleSignOut}
        />
      </Popover>
    </>
  );
};
