import type { RouteObject } from "react-router-dom";
import { AppContent } from "./app";
import Home from "./pages/Home";
import ResourceDetail from "./pages/resource-explorer/Detail";
import ResourceList from "./pages/resource-explorer/List";
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import { RouterErrorBoundary } from "./components/ui";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppContent />,
    errorElement: <RouterErrorBoundary />,
    children: [
      // 首页
      {
        index: true,
        element: <Home />,
      },
      // 资源浏览器路由
      {
        path: "r",
        children: [
          {
            path: ":rName",
            element: <ResourceList />,
          },
          {
            path: ":rName/*",
            element: <ResourceDetail />,
          },
        ],
      },
      // 认证相关路由
      {
        path: "auth",
        children: [
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "callback",
            element: <AuthCallback />,
          },
        ],
      },
    ],
  },
];
