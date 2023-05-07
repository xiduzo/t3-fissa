import { FC } from "react";
import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { IconProps } from "@expo/vector-icons/build/createIconSet";
import { logger } from "@fissa/utils";

export const Icon: FC<Props> = ({ name, ...iconProps }) => {
  if (Object.keys(Feather.glyphMap).includes(name))
    return (
      <Feather {...iconProps} name={name as keyof typeof Feather.glyphMap} />
    );
     if (Object.keys(AntDesign.glyphMap).includes(name))
    return (
      <AntDesign
        {...iconProps}
        name={name as keyof typeof AntDesign.glyphMap}
      />
    );
  if (Object.keys(FontAwesome.glyphMap).includes(name))
    return (
      <FontAwesome
        {...iconProps}
        name={name as keyof typeof FontAwesome.glyphMap}
      />
    );
 

  logger.warning(`Icon ${name} not found`);
  return null;
};

export type IconName =
  | keyof typeof FontAwesome.glyphMap
  | keyof typeof AntDesign.glyphMap
  | keyof typeof Feather.glyphMap;
interface Props extends IconProps<IconName> {}
