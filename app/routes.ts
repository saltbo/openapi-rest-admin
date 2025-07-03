import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home
  index("routes/home.tsx"),
  
  // Resources
  route("/r/:rName", "routes/resource-explorer/list.tsx"),
  route("/r/:rName/*", "routes/resource-explorer/detail.tsx"),

  // Auth
  route("/login", "routes/auth/login.tsx"),
  route("/auth/callback", "routes/auth/callback.tsx"),
] satisfies RouteConfig;
