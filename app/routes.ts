import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 前台首页 - 资源管理主页
  index("routes/frontend/home.tsx"),
  
  // 资源列表页面 - 显示顶级资源列表
  route("services/:sName/resources/:rName", "routes/frontend/resource-list.tsx"),
  
  // 资源详情页面 - 显示单个资源详情和子资源
  route("services/:sName/resources/:rName/*", "routes/frontend/resource-detail.tsx"),
  
  // 后台管理
  route("admin", "routes/admin/dashboard.tsx"),
  route("admin/apis", "routes/admin/apis.tsx"),
  route("admin/apis/:id", "routes/admin/api-detail.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
] satisfies RouteConfig;
