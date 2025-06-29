import type { Route } from "./+types/apis";
import { redirect } from "react-router";
import { apiConfigService } from "~/lib/db/api-config";
import APIConfigList from "~/pages/admin/components/APIConfigList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "API 配置管理 - OpenAPI Admin" },
    { name: "description", content: "管理您的 OpenAPI 配置" },
  ];
}

// 加载所有 API 配置
export async function loader({}: Route.LoaderArgs) {
  try {
    const [configs, stats] = await Promise.all([
      apiConfigService.getAllConfigs(),
      apiConfigService.getConfigStats()
    ]);

    return {
      configs,
      stats
    };
  } catch (error) {
    console.error('Failed to load API configs:', error);
    throw new Response("Failed to load API configurations", { status: 500 });
  }
}

// 处理创建、更新、删除操作
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "create": {
        const id = formData.get("id")?.toString();
        const name = formData.get("name")?.toString();
        const description = formData.get("description")?.toString();
        const openapiUrl = formData.get("openapiUrl")?.toString();
        const enabled = formData.get("enabled") === "true";
        const tags = formData.get("tags")?.toString();
        const version = formData.get("version")?.toString();

        if (!id || !name || !openapiUrl) {
          return { error: "请填写必填字段：ID、名称、OpenAPI URL" };
        }

        // 检查 ID 是否已存在
        const exists = await apiConfigService.configExists(id);
        if (exists) {
          return { error: "该 ID 已存在，请使用其他 ID" };
        }

        await apiConfigService.createConfig({
          id,
          name,
          description: description || "",
          openapiUrl,
          enabled,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          version: version || undefined
        });

        return { success: true, message: "API 配置创建成功" };
      }

      case "update": {
        const id = formData.get("id")?.toString();
        const name = formData.get("name")?.toString();
        const description = formData.get("description")?.toString();
        const openapiUrl = formData.get("openapiUrl")?.toString();
        const enabled = formData.get("enabled") === "true";
        const tags = formData.get("tags")?.toString();
        const version = formData.get("version")?.toString();

        if (!id || !name || !openapiUrl) {
          return { error: "请填写必填字段：ID、名称、OpenAPI URL" };
        }

        const updated = await apiConfigService.updateConfig(id, {
          name,
          description: description || "",
          openapiUrl,
          enabled,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          version: version || undefined
        });

        if (!updated) {
          return { error: "API 配置不存在" };
        }

        return { success: true, message: "API 配置更新成功" };
      }

      case "delete": {
        const id = formData.get("id")?.toString();
        if (!id) {
          return { error: "缺少 API ID" };
        }

        const deleted = await apiConfigService.deleteConfig(id);
        if (!deleted) {
          return { error: "API 配置不存在" };
        }

        return { success: true, message: "API 配置删除成功" };
      }

      case "toggleStatus": {
        const id = formData.get("id")?.toString();
        const enabled = formData.get("enabled") === "true";
        
        if (!id) {
          return { error: "缺少 API ID" };
        }

        const updated = await apiConfigService.updateConfig(id, { enabled });
        if (!updated) {
          return { error: "API 配置不存在" };
        }

        return { 
          success: true, 
          message: `API 配置已${enabled ? '启用' : '禁用'}` 
        };
      }

      case "batchToggle": {
        const ids = formData.get("ids")?.toString().split(',') || [];
        const enabled = formData.get("enabled") === "true";
        
        if (ids.length === 0) {
          return { error: "请选择要操作的配置" };
        }

        const count = await apiConfigService.updateMultipleConfigsStatus(ids, enabled);
        return { 
          success: true, 
          message: `已${enabled ? '启用' : '禁用'} ${count} 个配置` 
        };
      }

      default:
        return { error: "无效的操作" };
    }
  } catch (error) {
    console.error('Action error:', error);
    return { 
      error: error instanceof Error ? error.message : "操作失败" 
    };
  }
}

export default function APIs() {
  return <APIConfigList />;
}
