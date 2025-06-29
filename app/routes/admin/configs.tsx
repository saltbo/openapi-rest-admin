import type { Route } from "./+types/configs";
import OpenAPIDocumentList from "~/pages/admin/components/OpenAPIDocumentList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API 配置管理 - OpenAPI Admin" },
    { name: "description", content: "管理您的 OpenAPI 配置" },
  ];
}

export default function OpenAPIDocumentListRoute() {
  return <OpenAPIDocumentList />;
}
