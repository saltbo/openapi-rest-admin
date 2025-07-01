import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 前台首页 - 资源管理主页
  index("routes/home/home.tsx"),
  
  // 服务详情页面 - 显示服务的基本信息和统计数据
  route("services/:sName", "routes/home/service-detail.tsx"),
  
  // Resources
  route("services/:sName/resources/:rName", "routes/home/resource-list.tsx"),
  route("services/:sName/resources/:rName/*", "routes/home/resource-detail.tsx"),
  
  // API 路由
  route("api/configs", "routes/backend/api.configs.tsx"),
  route("api/configs/:id", "routes/backend/api.configs.$id.tsx"),
  route("api/stats", "routes/backend/api.stats.tsx"),
  route("api/search", "routes/backend/api.search.tsx"),
  
  // 后台管理
  route("admin", "routes/admin/dashboard.tsx"),
  route("admin/configs", "routes/admin/configs.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
] satisfies RouteConfig;
