# React Router v7 服务端逻辑实现指南

React Router v7 提供了强大的全栈功能，让你可以在同一个应用中实现前端和后端逻辑。以下是完整的实现方案：

## 1. 核心概念

### Loader（数据加载）
- 在页面渲染前在服务端执行
- 用于获取页面所需的数据
- 在客户端导航时也会执行

### Action（数据处理）
- 处理表单提交和数据修改
- 支持 POST、PUT、DELETE 等 HTTP 方法
- 在服务端执行

### API Routes
- 创建纯 API 端点
- 不渲染 UI，只返回 JSON 数据
- 支持 RESTful 设计

## 2. 文件结构

```
app/
├── routes/
│   ├── admin/
│   │   ├── api-detail.tsx          # 页面路由（包含 loader/action）
│   │   └── apis.tsx
│   ├── api/
│   │   ├── configs.tsx             # API 路由 /api/configs
│   │   └── configs.$id.tsx         # API 路由 /api/configs/:id
│   └── _index.tsx
├── services/
│   ├── api.ts                      # 业务逻辑服务
│   └── database.ts                 # 数据库操作
└── types/
    └── api.ts                      # 类型定义
```

## 3. 实现示例

### 3.1 页面路由与 Loader/Action

```typescript
// app/routes/admin/api-detail.tsx
import type { Route } from "./+types/api-detail";
import { redirect } from "react-router";
import { apiService } from "../../services/api";
import APIDetail from "../../pages/admin/APIDetail";

// 数据加载（服务端）
export async function loader({ params }: Route.LoaderArgs) {
  const apiId = params.id;
  
  if (!apiId) {
    throw new Response("API ID is required", { status: 400 });
  }

  try {
    const [configResponse, analysisResponse] = await Promise.all([
      apiService.getAPIConfig(apiId),
      apiService.getOpenAPIAnalysis(apiId)
    ]);

    return {
      apiConfig: configResponse.data,
      apiAnalysis: analysisResponse.data,
      apiId
    };
  } catch (error) {
    throw new Response("API not found", { status: 404 });
  }
}

// 表单处理（服务端）
export async function action({ request, params }: Route.ActionArgs) {
  const apiId = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "update":
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
```

### 3.2 API 路由

```typescript
// app/routes/api.configs.$.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { apiService } from "../services/api";

// 处理 GET 请求
export async function loader({ params, request }: LoaderFunctionArgs) {
  const apiId = params["*"]; // 捕获通配符参数

  try {
    if (apiId) {
      const response = await apiService.getAPIConfig(apiId);
      return Response.json(response);
    } else {
      const response = await apiService.getAPIConfigs();
      return Response.json(response);
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 404 }
    );
  }
}

// 处理 POST/PUT/DELETE 请求
export async function action({ request, params }: ActionFunctionArgs) {
  const method = request.method;
  const apiId = params["*"];

  try {
    switch (method) {
      case "POST":
        const createData = await request.json();
        const createResponse = await apiService.createAPIConfig(createData);
        return Response.json(createResponse, { status: 201 });

      case "PUT":
        if (!apiId) {
          return Response.json({ error: "API ID is required" }, { status: 400 });
        }
        const updateData = await request.json();
        const updateResponse = await apiService.updateAPIConfig(apiId, updateData);
        return Response.json(updateResponse);

      case "DELETE":
        if (!apiId) {
          return Response.json({ error: "API ID is required" }, { status: 400 });
        }
        await apiService.deleteAPIConfig(apiId);
        return new Response(null, { status: 204 });

      default:
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

### 3.3 业务逻辑服务

```typescript
// app/services/api.ts
import type { APIConfig } from '../types/api';

class APIService {
  async getAPIConfigs(): Promise<APIResponse<APIConfig[]>> {
    // 在实际应用中，这里连接数据库
    // 例如：await db.apiConfigs.findMany()
    return { data: [], success: true };
  }

  async createAPIConfig(config: Omit<APIConfig, 'id'>): Promise<APIResponse<APIConfig>> {
    // 在实际应用中，这里保存到数据库
    // 例如：await db.apiConfigs.create({ data: config })
    const newConfig = { id: generateId(), ...config };
    return { data: newConfig, success: true };
  }

  async updateAPIConfig(id: string, updates: Partial<APIConfig>): Promise<APIResponse<APIConfig>> {
    // 在实际应用中，这里更新数据库
    // 例如：await db.apiConfigs.update({ where: { id }, data: updates })
    return { data: updatedConfig, success: true };
  }

  async deleteAPIConfig(id: string): Promise<APIResponse<void>> {
    // 在实际应用中，这里删除数据库记录
    // 例如：await db.apiConfigs.delete({ where: { id } })
    return { data: undefined, success: true };
  }
}

export const apiService = new APIService();
```

### 3.4 组件中使用服务端数据

```typescript
// app/pages/admin/APIDetail.tsx
import { useLoaderData, useActionData, Form, useNavigation } from 'react-router';

export default function APIDetail() {
  const { apiConfig, apiAnalysis } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1>{apiConfig.name}</h1>
      
      {/* 使用 Form 组件提交表单到 action */}
      <Form method="post">
        <input type="hidden" name="intent" value="update" />
        <input name="name" defaultValue={apiConfig.name} />
        <input name="description" defaultValue={apiConfig.description} />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </Form>

      {/* 显示操作结果 */}
      {actionData?.error && <div className="error">{actionData.error}</div>}
      {actionData?.success && <div className="success">Success!</div>}
    </div>
  );
}
```

## 4. 最佳实践

### 4.1 错误处理
```typescript
export async function loader({ params }: LoaderArgs) {
  try {
    const data = await fetchData(params.id);
    return { data };
  } catch (error) {
    // 抛出 Response 对象来处理 HTTP 错误
    throw new Response("Not Found", { status: 404 });
  }
}
```

### 4.2 类型安全
```typescript
// 使用生成的类型
import type { Route } from "./+types/my-route";

export async function loader({ params }: Route.LoaderArgs) {
  // params 自动推导正确类型
  return { data: await fetchData(params.id) };
}
```

### 4.3 性能优化
```typescript
export async function loader({ params }: LoaderArgs) {
  // 并行请求多个数据源
  const [user, posts, comments] = await Promise.all([
    fetchUser(params.userId),
    fetchPosts(params.userId),
    fetchComments(params.userId)
  ]);

  return { user, posts, comments };
}
```

### 4.4 中间件模式
```typescript
// app/utils/auth.ts
export async function requireAuth(request: Request) {
  const token = request.headers.get("Authorization");
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return verifyToken(token);
}

// 在 loader 中使用
export async function loader({ request }: LoaderArgs) {
  await requireAuth(request);
  // 继续处理已认证的请求
}
```

## 5. 与传统后端的集成

如果你有现有的后端服务，可以在 React Router v7 中调用它们：

```typescript
export async function loader() {
  // 调用外部 API
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`
    }
  });
  
  const data = await response.json();
  return { data };
}
```

## 6. 部署考虑

React Router v7 应用可以部署为：
- **全栈应用**：包含服务端逻辑的完整应用
- **静态站点**：只构建客户端，loader/action 在构建时执行
- **边缘运行时**：部署到 Cloudflare Workers、Vercel Edge 等

通过这种方式，React Router v7 让你可以在一个框架中实现完整的全栈应用，而不需要单独的后端服务。
