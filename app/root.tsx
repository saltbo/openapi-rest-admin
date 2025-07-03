import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import type { Route } from "./+types/root";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorPage } from "./components/shared/ErrorPage";
import { AuthProvider } from "./components/auth/AuthContext";
import { initAuthService, getAuthService } from "./lib/auth/authService";
import "@ant-design/v5-patch-for-react-19";
import "./app.css";
import { useRuntimeConfig } from "./hooks/useRuntimeConfig";
import type { RuntimeConfig } from "config/types";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export const meta: Route.MetaFunction = () => {
  return [
    { title: "OpenAPI Admin" },
    { name: "description", content: "OpenAPI Admin Dashboard" },
  ];
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// 内部组件，用于在 QueryClientProvider 内部处理配置
function AppContent() {
  const { config, isLoading, isError } = useRuntimeConfig();

  useEffect(() => {
    // 当配置加载完成且没有错误时，初始化认证服务
    if (!isLoading && !isError && config && config.openapiDocUrl) {
      try {
        initAuthService(config as RuntimeConfig);

        // 如果有token，设置到API客户端
        const authService = getAuthService();
        if (authService && authService.isAuthenticated()) {
          const token = authService.getAccessToken();
          if (token) {
            console.log("Setting auth token to API client");
            // 可以在这里设置token到API客户端
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth service:", error);
      }
    }
  }, [config, isLoading, isError]);

  // 动态设置页面标题
  useEffect(() => {
    if (config?.siteTitle) {
      document.title = config.siteTitle;
    }
  }, [config?.siteTitle]);

  return (
    <AuthProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage
        status={error.status}
        title={error.status === 404 ? "页面未找到" : "错误"}
        message={
          error.status === 404
            ? "您访问的页面不存在。"
            : error.statusText || "发生了一个错误。"
        }
      />
    );
  }

  if (error instanceof Error) {
    return (
      <ErrorPage
        title="应用程序错误"
        message={error.message}
        stack={import.meta.env.DEV ? error.stack : undefined}
      />
    );
  }

  return <ErrorPage title="未知错误" message="发生了一个未知错误。" />;
}
