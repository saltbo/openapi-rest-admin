import ResourceList from "~/pages/resource-explorer/List";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resource List - OpenAPI Admin" },
    { name: "description", content: "OpenAPI Resource List" },
  ];
}

export default function ResourceListRoute({ params }: Route.ComponentProps) {
  return <ResourceList />;
}
