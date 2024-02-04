import { type FC, type PropsWithChildren } from "react";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return <main className="min-h-screen w-screen p-3 md:p-6 lg:p-12">{children}</main>;
};
