import type { Route } from "./+types/resource-detail";
import ResourceDetail from "../../pages/frontend/ResourceDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "资源详情 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 资源数据详情管理" },
  ];
}

export default function ResourceDetailRoute({ params }: Route.ComponentProps) {
  return <ResourceDetail apiId={params.sName} resourceId={params.rName} />;
}
