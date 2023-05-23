import { useEffect, useState } from "react";
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  LinearGradient,
  Paint,
  Text,
  Vertices,
  useSpring,
  vec,
} from "@shopify/react-native-skia";
import { theme } from "@fissa/tailwind-config";

import { Button, Typography } from "../../../src/components";

export const Test = () => {
  const [toggled, setToggled] = useState(false);
  const position = useSpring(toggled ? 180 : 100, {
    damping: 10,
    mass: 10,
  });

  return (
    <>
      <Canvas style={{ width: 256, height: 256 }}>
        <Group
          color={theme["100"]}
          layer={
            <Paint>
              <Blur blur={16} />
              <ColorMatrix
                matrix={[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 18, -7]}
              />
            </Paint>
          }
        >
          <LinearGradient colors={theme.gradient} start={vec(0, 0)} end={vec(50, 50)} />
          <Circle cx={100} cy={128} r={50} />

          <Circle cx={position} cy={128} r={50} />
        </Group>
      </Canvas>
      <Button title="toggle" onPress={() => setToggled(!toggled)} />
    </>
  );
};
