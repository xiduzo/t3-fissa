import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "~/styles/globals.css";

import { api, trpcClient } from "~/utils/api";
import { ThemeProvider } from "~/providers/ThemeProvider";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Outlet />
          <ToastContainer theme="dark" />
        </ThemeProvider>
      </QueryClientProvider>
    </api.Provider>
  ),
});
