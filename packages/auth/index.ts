export { authConfig } from "./src/auth-options";
export { getSession } from "./src/get-session";
export { Auth } from "@auth/core";

export type Session = {
  expires: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};