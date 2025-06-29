import type { Route } from "./+types/apis";
import APIConfigList from "~/pages/admin/components/APIConfigList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API 配置管理 - OpenAPI Admin" },
    { name: "description", content: "管理您的 OpenAPI 配置" },
  ];
}

export default function APIConfigListRoute() {
  return <APIConfigList />;
}
