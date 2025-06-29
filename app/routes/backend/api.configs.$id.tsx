import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { openAPIDocumentService } from "~/lib/db/openapi-document";
import type { UpdateOpenAPIDocumentInput } from "~/types/api";

// GET /api/configs/:id
export async function loader({ params }: LoaderFunctionArgs) {
  const apiId = params.id;

  if (!apiId) {
    return Response.json(
      { error: "API ID is required" },
      { status: 400 }
    );
  }

  try {
    const config = await openAPIDocumentService.getConfigById(apiId);
    if (!config) {
      return Response.json(
        { error: "API configuration not found" },
        { status: 404 }
      );
    }
    return Response.json(config);
  } catch (error) {
    console.error('API Config Loader Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT /api/configs/:id (更新)
// DELETE /api/configs/:id (删除)
export async function action({ request, params }: ActionFunctionArgs) {
  const method = request.method;
  const apiId = params.id;

  if (!apiId) {
    return Response.json({ error: "API ID is required" }, { status: 400 });
  }

  try {
    switch (method) {
      case "PUT": {
        // 更新 API 配置
        const updateData: UpdateOpenAPIDocumentInput = await request.json();
        const config = await openAPIDocumentService.updateConfig(apiId, updateData);
        
        if (!config) {
          return Response.json(
            { error: "API configuration not found" },
            { status: 404 }
          );
        }

        return Response.json(config);
      }

      case "DELETE": {
        // 删除 API 配置
        const deleted = await openAPIDocumentService.deleteConfig(apiId);
        if (!deleted) {
          return Response.json(
            { error: "API configuration not found" },
            { status: 404 }
          );
        }

        return new Response(null, { status: 204 });
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
