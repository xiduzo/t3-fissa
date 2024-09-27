import { type FC, type PropsWithChildren } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Header />
      <main className="flex-auto">{children}</main>
      <Footer />
    </>
  );
};
