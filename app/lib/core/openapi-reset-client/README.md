# OpenAPI REST Client

一个专为 OpenAPI 资源操作设计的 TypeScript 客户端库，提供类型安全和自动化的 REST API 交互能力。

## 特性

- 🚀 **类型安全**: 完全基于 TypeScript，提供完整的类型提示和检查
- 🎯 **专业设计**: 专门为 OpenAPI 规范的资源操作场景优化
- 🔄 **自动转换**: 智能的响应数据转换，自动处理列表和单个资源
- 📄 **分页支持**: 内置分页处理，支持常见的分页模式
- 🛡️ **错误处理**: 完善的错误处理机制，提供详细的错误信息
- 🔧 **灵活配置**: 支持认证、请求头、超时等多种配置选项

## 安装

```bash
npm install openapi-rest-client
# 或
yarn add openapi-rest-client
```

## 快速开始

### 基本用法

```typescript
import { OpenapiRestClient } from 'openapi-rest-client';
import type { ResourceOperation } from './types';

// 初始化客户端
const client = new OpenapiRestClient('https://api.example.com');

// 设置认证
client.setAuthToken('your-token');

// 定义资源 Schema
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string' }
  }
};

// 定义操作
const getUsersOperation: ResourceOperation = {
  method: 'GET',
  path: '/users',
  parameters: [],
  responses: {},
  tags: ['users']
};

// 请求用户列表
const response = await client.request(getUsersOperation, userSchema, {
  query: { page: 1, pageSize: 10 }
});

console.log(response.data); // 用户列表
console.log(response.pagination); // 分页信息
```

### 列表操作

```typescript
// 获取用户列表，支持分页、排序、过滤
const usersResponse = await client.requestList(getUsersOperation, userSchema, {
  page: 1,
  pageSize: 20,
  sort: 'name',
  order: 'asc',
  filters: {
    status: 'active',
    role: 'user'
  }
});

console.log(usersResponse.data); // User[]
console.log(usersResponse.pagination); // PaginationInfo
```

### 单个资源操作

```typescript
// 获取单个用户
const getUserOperation: ResourceOperation = {
  method: 'GET',
  path: '/users/{id}',
  parameters: [],
  responses: {},
  tags: ['users']
};

const userResponse = await client.requestSingle(getUserOperation, userSchema, {
  pathParams: { id: 123 }
});

console.log(userResponse.data); // User 对象

// 创建用户
const createUserOperation: ResourceOperation = {
  method: 'POST',
  path: '/users',
  parameters: [],
  responses: {},
  tags: ['users']
};

const newUser = await client.requestSingle(createUserOperation, userSchema, {
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// 更新用户
const updateUserOperation: ResourceOperation = {
  method: 'PUT',
  path: '/users/{id}',
  parameters: [],
  responses: {},
  tags: ['users']
};

const updatedUser = await client.requestSingle(updateUserOperation, userSchema, {
  pathParams: { id: 123 },
  body: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
});
```

## API 参考

### OpenapiRestClient

主要的客户端类，继承自 `BaseOpenapiClient`。

#### 构造函数

```typescript
constructor(baseURL: string)
```

#### 方法

##### `request<T>(operation, resourceSchema, options?)`

通用的资源操作方法，自动判断是列表还是单个资源操作。

**参数：**
- `operation: ResourceOperation` - 资源操作定义
- `resourceSchema: OpenAPIV3.SchemaObject` - 资源 Schema
- `options?: ResourceRequestOptions` - 请求选项

**返回：**
- `Promise<ResourceResponse<T> | PaginatedResponse<T>>`

##### `requestList<T>(operation, resourceSchema, options?)`

专门用于列表操作的方法。

**参数：**
- `operation: ResourceOperation` - 资源操作定义
- `resourceSchema: OpenAPIV3.SchemaObject` - 资源 Schema
- `options?: ListRequestOptions` - 列表请求选项

**返回：**
- `Promise<PaginatedResponse<T>>`

##### `requestSingle<T>(operation, resourceSchema, options?)`

专门用于单个资源操作的方法。

**参数：**
- `operation: ResourceOperation` - 资源操作定义
- `resourceSchema: OpenAPIV3.SchemaObject` - 资源 Schema
- `options?: ResourceRequestOptions` - 请求选项

**返回：**
- `Promise<ResourceResponse<T>>`

##### `setAuthToken(token, type?)`

设置认证令牌。

**参数：**
- `token: string` - 认证令牌
- `type?: 'Bearer' | 'Basic'` - 令牌类型，默认为 'Bearer'

##### `setDefaultHeaders(headers)`

设置默认请求头。

**参数：**
- `headers: Record<string, string>` - 请求头对象

##### `removeAuthToken()`

移除认证令牌。

### 类型定义

#### ResourceRequestOptions

```typescript
interface ResourceRequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, any>;
  pathParams?: Record<string, any>;
  body?: any;
  timeout?: number;
  withCredentials?: boolean;
}
```

#### ListRequestOptions

```typescript
interface ListRequestOptions extends Omit<ResourceRequestOptions, 'query'> {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, any>;
  query?: Record<string, any>;
}
```

#### ResourceResponse

```typescript
interface ResourceResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  raw?: Response;
}
```

#### PaginatedResponse

```typescript
interface PaginatedResponse<T = any> extends ResourceResponse<T[]> {
  pagination: PaginationInfo;
}
```

#### PaginationInfo

```typescript
interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

## 错误处理

客户端提供了完善的错误处理机制：

```typescript
import { APIError } from 'openapi-rest-client';

try {
  const response = await client.request(operation, schema, options);
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Type:', error.type);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 高级用法

### 自定义请求配置

```typescript
// 设置自定义请求头
client.setDefaultHeaders({
  'X-Custom-Header': 'custom-value',
  'Accept-Language': 'zh-CN'
});

// 设置超时时间
const response = await client.request(operation, schema, {
  timeout: 5000 // 5 秒
});
```

### 处理文件上传

```typescript
const uploadOperation: ResourceOperation = {
  method: 'POST',
  path: '/files',
  parameters: [],
  responses: {},
  tags: ['files']
};

const formData = new FormData();
formData.append('file', file);

const response = await client.requestSingle(uploadOperation, fileSchema, {
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### 批量操作

```typescript
// 批量创建资源
const batchCreateOperation: ResourceOperation = {
  method: 'POST',
  path: '/users/batch',
  parameters: [],
  responses: {},
  tags: ['users']
};

const batchResponse = await client.requestSingle(batchCreateOperation, userSchema, {
  body: {
    users: [
      { name: 'User 1', email: 'user1@example.com' },
      { name: 'User 2', email: 'user2@example.com' }
    ]
  }
});
```

## 最佳实践

1. **类型安全**: 始终为泛型参数提供具体的类型
2. **错误处理**: 使用 try-catch 包装所有 API 调用
3. **Schema 复用**: 将常用的 Schema 定义提取到单独的文件中
4. **操作定义**: 建议将 ResourceOperation 定义集中管理
5. **认证管理**: 在应用初始化时设置认证信息

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 本客户端专为 OpenAPI 规范设计，需要配合 `ResourceOperation` 和相应的 Schema 定义使用。确保您的 OpenAPI 文档结构清晰，以获得最佳的使用体验。
