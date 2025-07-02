import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 服务详情页面 - 显示服务的基本信息和统计数据
  index("routes/home/service-detail.tsx"),
  
  // Resources
  route("/r/:rName", "routes/home/resource-list.tsx"),
  route("/r/:rName/*", "routes/home/resource-detail.tsx"),
] satisfies RouteConfig;
