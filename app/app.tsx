import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./components/auth/AuthContext";
import { ConfigProvider } from "./lib/config/ConfigContext";
import type { RuntimeConfig } from "~/lib/config/types";
import { routes } from "./routes";
import { createDefaultConfig } from "./lib/config/config";

import "@ant-design/v5-patch-for-react-19";
import "./app.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initAuthService } from "./lib/auth/authService";
import { useEffect } from "react";

export default function App(configuration?: RuntimeConfig) {
  if (!configuration?.openapiDocUrl) {
    configuration = createDefaultConfig();
    console.warn("No configuration provided, using default configuration.");
  }
  console.log("configuration:", configuration);

  // Set the document title if siteTitle is provided in the configuration
  useEffect(() => {
    if (configuration?.siteTitle) {
      document.title = configuration.siteTitle;
    }
  }, [configuration?.siteTitle]);

  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

  // Initialize authentication service with the provided configuration
  initAuthService(configuration);
  const { basename } = configuration;
  const router = createBrowserRouter(routes, {
    basename,
  });

  return (
    <ConfigProvider config={configuration}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export function Layout() {
  return (
    <AuthProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
