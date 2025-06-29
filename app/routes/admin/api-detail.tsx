import type { Route } from "./+types/api-detail";
import { redirect } from "react-router";
import { apiService } from "../../pages/admin/services/api";
import APIDetail from "../../pages/admin/components/APIDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API 详情 - OpenAPI Admin" },
    { name: "description", content: "查看 API 配置详情和资源" },
  ];
}

// 服务端数据加载
export async function loader({ params }: Route.LoaderArgs) {
  const apiId = params.id;
  
  if (!apiId) {
    throw new Response("API ID is required", { status: 400 });
  }

  try {
    // 只获取 API 配置，分析结果由前端处理
    const configResponse = await apiService.getAPIConfig(apiId);

    return {
      apiConfig: configResponse.data,
      apiId
    };
  } catch (error) {
    throw new Response("API not found", { status: 404 });
  }
}

// 服务端表单处理
export async function action({ request, params }: Route.ActionArgs) {
  const apiId = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "update":
      // 更新 API 配置
      const name = formData.get("name")?.toString();
      const description = formData.get("description")?.toString();
      
      if (!name) {
        return { error: "Name is required" };
      }

      try {
        await apiService.updateAPIConfig(apiId!, { name, description });
        return { success: true, message: "API updated successfully" };
      } catch (error) {
        return { error: "Failed to update API" };
      }

    case "delete":
      try {
        await apiService.deleteAPIConfig(apiId!);
        return redirect("/admin/apis");
      } catch (error) {
        return { error: "Failed to delete API" };
      }

    default:
      return { error: "Invalid action" };
  }
}

export default function APIDetailRoute() {
  return <APIDetail />;
}
