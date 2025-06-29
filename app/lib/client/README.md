# HTTP 客户端重构说明

## 概述

我们将原本分散在 `admin-api.ts` 和 `api-client.ts` 中的重复 HTTP 请求逻辑抽取到了 `app/lib/client` 目录下，创建了一套统一的 HTTP 客户端体系。

## 重构后的结构

```
app/lib/client/
├── base-client.ts          # 基础 HTTP 客户端
├── api-config-client.ts    # API 配置专用客户端
└── index.ts                # 导出文件
```

## 抽取的公共逻辑

### 1. HTTP 请求处理
- 统一的 `fetch` 包装
- 自动处理 JSON 序列化/反序列化
- 查询参数构建
- 错误处理和消息格式化

### 2. 错误处理
- 统一的错误响应处理
- 详细的错误消息提取
- HTTP 状态码处理

### 3. 请求配置
- 自动设置 `Content-Type: application/json`
- 支持各种 HTTP 方法（GET, POST, PUT, DELETE, PATCH）
- 灵活的请求头配置

## 使用方式

### BaseHTTPClient

所有客户端的基类，提供通用的 HTTP 请求方法：

```typescript
import { BaseHTTPClient } from '~/lib/client';

class MyAPIClient extends BaseHTTPClient {
  constructor() {
    super('/api'); // 设置基础 URL
  }

  async getData() {
    return this.get('/data');
  }

  async createItem(data: any) {
    return this.post('/items', data);
  }
}
```

### APIConfigClient

专门处理 API 配置相关请求的客户端：

```typescript
import { apiConfigClient } from '~/lib/client';

// 获取所有配置
const configs = await apiConfigClient.getConfigs();

// 获取单个配置
const config = await apiConfigClient.getConfig('api-id');

// 创建配置
const newConfig = await apiConfigClient.createConfig({
  id: 'new-api',
  name: 'New API',
  description: 'Description',
  openapiUrl: 'https://example.com/openapi.json'
});
```

## 重构前后对比

### 重构前（admin-api.ts）
```typescript
async getConfigs(): Promise<APIConfigModel[]> {
  const response = await fetch(`${this.baseUrl}/configs`);
  if (!response.ok) {
    throw new Error('Failed to fetch configs');
  }
  return response.json();
}
```

### 重构后（admin-api.ts）
```typescript
async getConfigs(): Promise<APIConfigModel[]> {
  return apiConfigClient.getConfigs();
}
```

## 类型转换处理

由于数据库模型（`APIConfigModel`）和前端使用的类型（`APIConfig`）之间存在差异，我们在 `FrontendAPIService` 中进行了必要的类型转换：

- `openapiUrl` ↔ `openapi_url`
- JSON 字符串的 `tags` ↔ 数组类型的 `tags`
- 日期类型的处理

## 优势

1. **减少代码重复**：消除了重复的 HTTP 请求逻辑
2. **统一错误处理**：所有请求使用相同的错误处理策略
3. **类型安全**：完整的 TypeScript 支持
4. **易于扩展**：新的 API 客户端可以轻松继承基础功能
5. **维护性**：集中管理 HTTP 请求逻辑，便于修改和调试

## 使用示例

### 在组件中使用

```typescript
import { apiConfigClient } from '~/lib/client';

// 在 React Query 中使用
const { data: configs } = useQuery({
  queryKey: ['api-configs'],
  queryFn: () => apiConfigClient.getConfigs()
});

// 在 mutation 中使用
const createMutation = useMutation({
  mutationFn: (data: CreateAPIConfigInput) => apiConfigClient.createConfig(data),
  onSuccess: () => {
    // 处理成功
  }
});
```
