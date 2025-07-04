import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { AppLayout } from "./components/layout/AppLayout";
import { ErrorPage } from "./components/shared";
import { AuthProvider } from "./components/auth/AuthContext";
import { initAuthService, getAuthService } from "./lib/auth/authService";
import "@ant-design/v5-patch-for-react-19";
import "./app.css";
import { useRuntimeConfig } from "./hooks/useRuntimeConfig";
import type { RuntimeConfig } from "config/types";
import { routes } from "./routes";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// 配置加载组件，在路由初始化之前加载配置
function RouterProviderX() {
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

  // 配置加载中显示加载状态
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // 配置加载错误
  if (isError) {
    return (
      <ErrorPage
        title="配置加载失败"
        message="无法加载应用配置，请检查网络连接或配置文件。"
      />
    );
  }

  // 配置加载完成，创建路由器并渲染应用
  const router = createBrowserRouter(routes, { basename: config?.basename });
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProviderX />
    </QueryClientProvider>
  );
}

export function AppContent() {
  return (
    <AuthProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
