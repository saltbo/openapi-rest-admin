import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "管理后台 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 配置管理后台" },
  ];
}

export default function Dashboard() {
  // return <AdminDashboard />;
}
