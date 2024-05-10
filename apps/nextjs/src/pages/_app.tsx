import "../styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppType } from "next/app";

import { ToastContainer } from "~/components/Toast";
import { ThemeProvider } from "~/providers/ThemeProvider";
import { api } from "~/utils/api";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  // eslint-disable-next-line
  const MyComponent = Component as any;
  return (
    <SessionProvider session={session}>
      <Analytics />
      <ThemeProvider>
        <MyComponent {...pageProps} />
        <ToastContainer />
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
