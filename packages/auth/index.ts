export { auth } from "./src/auth";
export { getSession } from "./src/get-session";

export type Session = {
  expires: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};