import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 前台首页 - 资源管理主页
  index("routes/frontend/home.tsx"),
  
  // 服务详情页面 - 显示服务的基本信息和统计数据
  route("services/:sName", "routes/frontend/service-detail.tsx"),
  
  // 顶级资源列表页面 - 显示顶级资源列表
  route("services/:sName/resources/:rName", "routes/frontend/resource-list.tsx"),
  
  // 嵌套子资源列表页面 - 显示带有父资源上下文的子资源列表
  route("services/:sName/resources/:rName/*", "routes/frontend/nested-resource-list.tsx"),
  
  // 后台管理
  route("admin", "routes/admin/dashboard.tsx"),
  route("admin/apis", "routes/admin/apis.tsx"),
  route("admin/apis/:id", "routes/admin/api-detail.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
] satisfies RouteConfig;
