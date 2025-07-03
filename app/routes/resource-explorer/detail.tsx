import { useLocation, useParams } from "react-router";
import ResourceList from "~/pages/resource-explorer/List";
import ResourceDetail from "~/pages/resource-explorer/Detail";

export default function NestedResourceRoute() {
  const params = useParams<{ rName: string; "*": string }>();
  const splat = params["*"] || "";
  const pathSegments = splat.split("/").filter(Boolean);

  // 判断是详情页面还是列表页面
  // 如果路径段数为奇数，说明最后一段是具体的资源ID，显示详情页
  // 如果路径段数为偶数，说明最后一段是资源名称，显示列表页
  const isDetailPage = pathSegments.length % 2 === 1;

  if (isDetailPage) {
    // 显示资源详情页面
    return <ResourceDetail />;
  } else {
    // 显示子资源列表页面
    return <ResourceList />;
  }
}
