import { useSearchParams } from "expo-router";

const Room = () => {
  const { pin } = useSearchParams();

  console.log(pin);
  return null;
};

export default Room;
