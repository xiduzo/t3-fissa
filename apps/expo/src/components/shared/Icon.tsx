import { type FC } from "react";
import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";

export const Icon: FC<Props> = ({ name, ...props }) => {
  if (Object.keys(Feather.glyphMap).includes(name))
    return <Feather size={24} {...props} name={name as keyof typeof Feather.glyphMap} />;

  if (Object.keys(AntDesign.glyphMap).includes(name))
    return <AntDesign size={24} {...props} name={name as keyof typeof AntDesign.glyphMap} />;

  if (Object.keys(FontAwesome.glyphMap).includes(name))
    return <FontAwesome size={24} {...props} name={name as keyof typeof FontAwesome.glyphMap} />;

  console.warn(`Icon ${name} not found`);
  return null;
};

export type IconName =
  | keyof typeof FontAwesome.glyphMap
  | keyof typeof AntDesign.glyphMap
  | keyof typeof Feather.glyphMap;
type Props = IconProps<IconName>;
