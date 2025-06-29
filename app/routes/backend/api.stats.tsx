import type { LoaderFunctionArgs } from "react-router";
import { openAPIDocumentService } from "~/lib/db/openapi-document";

// GET /api/stats
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const stats = await openAPIDocumentService.getConfigStats();
    return Response.json(stats);
  } catch (error) {
    console.error('Stats API Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
