export type Theme = {
  name: string;
  100: string;
  500: string;
  900: string;
  gradient: [string, string];
};

const pinkey: Theme = {
  name: "pinkey",
  100: "#FFCAF7",
  500: "#FF5FE5",
  900: "#150423",
  gradient: ["#FF5FE5", "#FF5F72"],
};

const orangy: Theme = {
  name: "orangy",
  100: "#FFC9C9",
  500: "#FF5F5F",
  900: "#1C0A00",
  gradient: ["#FF5F5F", "#FF995F"],
};

const greeny: Theme = {
  name: "greeny",
  100: "#CBFFE3",
  500: "#5FFF95",
  900: "#021600",
  gradient: ["#5FFF95", "#5FFFEC"],
};

const blueey: Theme = {
  name: "blueey",
  100: "#CBF9FF",
  500: "#5FB2FF",
  900: "#001428",
  gradient: ["#5FB2FF", "#18FFF1"],
};

const sunny: Theme = {
  name: "sunny",
  100: "#FFC9C9",
  500: "#FFAD33",
  900: "#241800",
  gradient: ["#FFBF5F", "#DFFF5F"],
};

const limey: Theme = {
  name: "limey",
  100: "#FFFED9",
  500: "#CCFF5F",
  900: "#0B1A00",
  gradient: ["#FFF95F", "#BCFF4E"],
};

export const themes: Theme[] = [sunny, limey, blueey, pinkey, orangy, greeny];
