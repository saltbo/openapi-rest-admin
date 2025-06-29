import type { LoaderFunctionArgs } from "react-router";
import { apiConfigService } from "../lib/db/api-config";

// GET /api/search?tags=tag1,tag2
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const tagsParam = url.searchParams.get('tags');
  
  if (!tagsParam) {
    return Response.json(
      { error: "Missing required parameter: tags" },
      { status: 400 }
    );
  }

  try {
    const tags = tagsParam.split(',').map(tag => tag.trim()).filter(Boolean);
    const configs = await apiConfigService.searchConfigsByTags(tags);
    return Response.json({ data: configs, success: true });
  } catch (error) {
    console.error('Search API Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
