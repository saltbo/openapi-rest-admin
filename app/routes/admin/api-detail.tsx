import type { Route } from "./+types/api-detail";
import APIDetail from "../../pages/admin/APIDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API 详情 - OpenAPI Admin" },
    { name: "description", content: "查看 API 配置详情和资源" },
  ];
}

export default function APIDetailRoute() {
  return <APIDetail />;
}
