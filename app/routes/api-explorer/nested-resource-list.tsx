import type { Route } from "./+types/nested-resource-list";
import { useParams } from 'react-router';
import ResourceList from "~/pages/api-explorer/resource/List";
import ResourceDetail from "~/pages/api-explorer/resource/Detail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "资源管理 - OpenAPI Admin" },
    { name: "description", content: "OpenAPI 资源数据管理" },
  ];
}

export default function NestedResourceRoute({ params }: Route.ComponentProps) {
  const splat = params['*'] || '';
  const pathSegments = splat.split('/').filter(Boolean);
  
  // 判断是详情页面还是列表页面
  // 如果路径段数为奇数，说明最后一段是具体的资源ID，显示详情页
  // 如果路径段数为偶数，说明最后一段是资源名称，显示列表页
  const isDetailPage = pathSegments.length % 2 === 1;
  
  if (isDetailPage) {
    // 显示资源详情页面
    return <ResourceDetail apiId={params.sName} resourceId={params.rName} />;
  } else {
    // 显示子资源列表页面
    return <ResourceList apiId={params.sName} resourceId={params.rName} nestedPath={splat} />;
  }
}
