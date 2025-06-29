import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 前台首页 - 资源管理主页
  index("routes/api-explorer/home.tsx"),
  
  // 服务详情页面 - 显示服务的基本信息和统计数据
  route("services/:sName", "routes/api-explorer/service-detail.tsx"),
  
  // 顶级资源列表页面 - 显示顶级资源列表
  route("services/:sName/resources/:rName", "routes/api-explorer/resource-list.tsx"),
  
  // 嵌套子资源列表页面 - 显示带有父资源上下文的子资源列表
  route("services/:sName/resources/:rName/*", "routes/api-explorer/nested-resource-list.tsx"),
  
  // API 路由
  route("api/configs", "routes/backend/api.configs.tsx"),
  route("api/configs/:id", "routes/backend/api.configs.$id.tsx"),
  route("api/stats", "routes/backend/api.stats.tsx"),
  route("api/search", "routes/backend/api.search.tsx"),
  
  // 后台管理
  route("admin", "routes/admin/dashboard.tsx"),
  route("admin/apis", "routes/admin/apis.tsx"),
  route("admin/apis/:id", "routes/admin/api-detail.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
] satisfies RouteConfig;
