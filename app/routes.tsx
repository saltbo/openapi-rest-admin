import { useParams, type RouteObject } from "react-router-dom";
import { Layout } from "./app";
import Home from "./pages/Home";
import ResourceDetail from "./pages/resource-explorer/Detail";
import ResourceList from "./pages/resource-explorer/List";
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import { RouterErrorBoundary } from "./components/ui";

export default function NestedResourceRoute() {
  const params = useParams<{ rName: string; "*": string }>();
  const splat = params["*"] || "";
  const pathSegments = splat.split("/").filter(Boolean);

  // 判断是详情页面还是列表页面
  // 如果路径段数为奇数，说明最后一段是具体的资源ID，显示详情页
  // 如果路径段数为偶数，说明最后一段是资源名称，显示列表页
  const isDetailPage = pathSegments.length % 2 === 1;
  if (isDetailPage) {
    // 显示资源详情页面
    return <ResourceDetail />;
  } else {
    // 显示子资源列表页面
    return <ResourceList />;
  }
}

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
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
            element: <NestedResourceRoute />,
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
