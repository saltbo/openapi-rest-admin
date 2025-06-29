import type { Route } from "./+types/service-detail";
import ServiceDetail from "~/pages/api-explorer/components/ServiceDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "服务详情 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 服务详情页面" },
  ];
}

export default function ServiceDetailRoute() {
  return <ServiceDetail />;
}
