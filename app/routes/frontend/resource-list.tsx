import type { Route } from "./+types/resource-list";
import ResourceList from "../../pages/api-explorer/components/ResourceList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "资源列表 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 资源数据列表管理" },
  ];
}

export default function ResourceListRoute({ params }: Route.ComponentProps) {
  return <ResourceList apiId={params.sName} resourceId={params.rName} />;
}
