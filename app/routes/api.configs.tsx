import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { apiConfigService } from "../lib/db/api-config";
import type { CreateAPIConfigInput } from "../types/api";

// GET /api/configs
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  try {
    // 获取所有或已启用的 API 配置
    const enabledOnly = url.searchParams.get('enabled') === 'true';
    const configs = enabledOnly 
      ? await apiConfigService.getEnabledConfigs()
      : await apiConfigService.getAllConfigs();
    
    return Response.json(configs);
  } catch (error) {
    console.error('API Config Loader Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/configs (创建)
// PATCH /api/configs (批量操作)
export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;

  try {
    switch (method) {
      case "POST": {
        // 创建新的 API 配置
        const createData: CreateAPIConfigInput = await request.json();
        
        // 验证必填字段
        if (!createData.id || !createData.name || !createData.openapiUrl) {
          return Response.json(
            { error: "Missing required fields: id, name, openapiUrl" },
            { status: 400 }
          );
        }

        // 检查 ID 是否已存在
        const exists = await apiConfigService.configExists(createData.id);
        if (exists) {
          return Response.json(
            { error: "API configuration with this ID already exists" },
            { status: 409 }
          );
        }

        const config = await apiConfigService.createConfig(createData);
        return Response.json(config, { status: 201 });
      }

      case "PATCH": {
        // 批量操作
        const { action: batchAction, ids, data } = await request.json();
        
        if (batchAction === "updateStatus" && Array.isArray(ids) && typeof data?.enabled === "boolean") {
          const count = await apiConfigService.updateMultipleConfigsStatus(ids, data.enabled);
          return Response.json({ 
            updatedCount: count
          });
        }

        return Response.json(
          { error: "Invalid batch action" },
          { status: 400 }
        );
      }

      default:
        return Response.json(
          { error: "Method not allowed" },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('API Config Action Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
