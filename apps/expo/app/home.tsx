import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState, type FC } from "react";
import { View } from "react-native";

import {
  Button,
  ButtonGroup,
  IconButton,
  PageTemplate,
  Popover,
  Rejoin,
  Typography,
} from "../src/components";
import { useAuth } from "../src/providers";
import { api } from "../src/utils";

const Home = () => {
  const { user } = useAuth();
  const { data } = api.auth.getUserFissa.useQuery();
  const { replace } = useRouter();

  const [showHostOfFissaWarning, setShowHostOfFissaWarning] = useState(false);

  const handleHostFissa = useCallback(() => {
    if (data?.hostOf) return setShowHostOfFissaWarning(true);

    replace(`/host`);
  }, [data?.hostOf, replace]);

  const closePopover = useCallback(() => {
    setShowHostOfFissaWarning(false);
  }, []);

  return (
    <PageTemplate className="pt-40">
      <Stack.Screen
        options={{
          headerShown: true,
          animation: "fade",
          headerRight,
        }}
      />
      <View>
        <Typography variant="h1" centered className="mb-4">
          Hi there {user?.display_name},
        </Typography>
        <Typography centered variant="h5">
          what are you up to
        </Typography>
      </View>
      <View className="space-y-6">
        <Button title="join a fissa" linkTo="/join" />
        <Button
          title="host a fissa"
          disabled={user?.product !== "premium"}
          variant="outlined"
          onPress={handleHostFissa}
        />
        {user?.product !== "premium" && (
          <Typography dimmed centered className="mt-4" variant="bodyM">
            Only spotify premium users can host a fissa
          </Typography>
        )}
      </View>
      <View>
        <Rejoin />
        <HostOfFissaPopover
          pin={data?.hostOf?.pin}
          visible={showHostOfFissaWarning}
          onRequestClose={closePopover}
        />
      </View>
    </PageTemplate>
  );
};

export default Home;

const headerRight = () => <AccountDetails />;

const AccountDetails = () => {
  const { push } = useRouter();

  return (
    <>
      <IconButton title="account details" icon="user" onPress={() => push('/profile')} />
    </>
  );
};

const HostOfFissaPopover: FC<HostOfFissaPopoverProps> = ({ visible, pin, onRequestClose }) => {
  return (
    <Popover visible={visible} onRequestClose={onRequestClose}>
      <Typography centered className="text-7xl" variant="h1">
        🦭
      </Typography>
      <Typography variant="h1" centered className="my-2" inverted>
        It seems like you are already hosting a Fissa
      </Typography>
      <Typography variant="bodyL" className="mb-8" centered inverted>
        Hosting a new Fissa will stop your current Fissa!
      </Typography>
      <ButtonGroup>
        <Button
          inverted
          onPress={onRequestClose}
          linkTo="/host"
          title="Roger that, I want a new Fissa"
        />
        <Button
          inverted
          title={`Rejoin Fissa ${pin}`}
          onPress={onRequestClose}
          variant="text"
          linkTo={`/fissa/${pin}`}
        />
      </ButtonGroup>
    </Popover>
  );
};

interface HostOfFissaPopoverProps {
  visible: boolean;
  onRequestClose: () => void;
  pin?: string;
}
