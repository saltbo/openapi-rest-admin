# RESTfulAPIClient 响应转换功能 - 重构说明

## 重构概述

RESTfulAPIClient已经被重构以解决responseBody中的数据解析问题。新版本提供了强大的响应数据转换功能，能够自动处理各种不同的API响应格式。

### 主要改进

1. **智能响应转换**：自动识别和处理多种常见的API响应格式
2. **自定义转换器支持**：允许完全自定义的响应转换逻辑
3. **严格错误处理**：找不到期望的数据格式时立即报错，不做fallback
4. **类型安全**：完整的TypeScript类型支持

### 支持的响应格式

#### 1. 直接数组响应
```json
[
  { "id": 1, "name": "Item 1" },
  { "id": 2, "name": "Item 2" }
]
```

#### 2. 包装在数据字段中的响应
```json
{
  "data": [...],           // 或 "items", "list", "results", "records"
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

#### 3. 分页信息在嵌套对象中
```json
{
  "data": [...],
  "pagination": {
    "current": 1,
    "size": 20,
    "total": 100
  }
}
```

### 新的类型定义

```typescript
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ParsedResponseData<T = any> {
  data: T;
  pagination?: PaginationInfo;
}

export type ResponseTransformer<T = any> = (responseData: any) => {
  data: T;
  pagination?: PaginationInfo;
};
```

### 使用方法

```typescript
// 基本使用 - 使用默认转换器
const client = new RESTfulAPIClient('https://api.example.com');

// 使用自定义转换器
const customTransformer: ResponseTransformer = (responseData: any) => {
  return {
    data: responseData.custom_data,
    pagination: {
      page: responseData.current_page,
      pageSize: responseData.per_page,
      total: responseData.total_items,
      totalPages: Math.ceil(responseData.total_items / responseData.per_page)
    }
  };
};

const client = new RESTfulAPIClient('https://api.example.com', customTransformer);

// 运行时设置转换器
client.setResponseTransformer(customTransformer);
client.removeResponseTransformer();
```

# OpenAPI 服务架构

这是一个基于社区标准库的 OpenAPI 服务架构，用于解析 OpenAPI 文档、生成表单和表格 schema，以及处理 RESTful API 请求。

## 核心组件

### 1. OpenAPIDocumentParser

专门处理 OpenAPI 文档的解析，使用 `swagger-parser` 库作为底层解析引擎。

**主要功能：**
- 解析和验证 OpenAPI/Swagger 文档
- 提取资源 schema 信息
- 生成资源统计数据
- 提供操作信息查询

**使用示例：**

```typescript
import { OpenAPIDocumentParser } from '@/lib/api';

const parser = new OpenAPIDocumentParser();

// 解析文档
await parser.parseDocument('https://api.example.com/openapi.json');

// 获取文档信息
const docInfo = parser.getDocumentInfo();

// 获取资源统计
const stats = parser.getResourceStatistics();

// 获取所有资源 schemas
const schemas = parser.getAllResourceSchemas();

// 获取特定操作信息
const operation = parser.getOperationInfo('GET', '/users');
```

### 2. SchemaRenderer

负责为页面渲染提供 schema，基于 OpenAPI schema 生成 `react-jsonschema-form` 可用的格式。

**主要功能：**
- 生成表单 schema（创建、编辑）
- 生成表格 schema
- 字段过滤和排序
- UI 控件自动映射

**使用示例：**

```typescript
import { SchemaRenderer } from '@/lib/api';

const renderer = new SchemaRenderer();

// 生成创建表单 schema
const createFormSchema = renderer.getCreateFormSchema(openApiSchema, {
  excludeFields: ['id', 'created_at', 'updated_at'],
  fieldOrder: ['name', 'email', 'age']
});

// 生成编辑表单 schema
const editFormSchema = renderer.getEditFormSchema(openApiSchema, {
  fieldConfig: {
    id: { 'ui:readonly': true },
    email: { 'ui:widget': 'email' }
  }
});

// 生成表格 schema
const tableSchema = renderer.getTableSchema(openApiSchema, {
  columns: ['id', 'name', 'email', 'created_at'],
  sortableColumns: ['id', 'name', 'created_at'],
  filterableColumns: ['name', 'email']
});
```

### 3. RESTfulAPIClient

负责发送网络请求，包括 CRUD 操作，严格遵循 RESTful 规范。

**主要功能：**
- 参数验证（基于 OpenAPI 定义）
- 响应解析和数据提取
- 错误处理和分类
- 认证管理

**使用示例：**

```typescript
import { RESTfulAPIClient } from '@/lib/api';

const client = new RESTfulAPIClient('https://api.example.com');

// 设置认证
client.setAuthToken('your-jwt-token');

// 获取列表（带分页和过滤）
const listResponse = await client.getList(operation, {
  page: 1,
  pageSize: 10,
  filters: { status: 'active' },
  sort: 'created_at',
  order: 'desc'
});

// 获取单个资源
const user = await client.getById(operation, '123');

// 创建资源
const newUser = await client.create(operation, {
  name: 'John Doe',
  email: 'john@example.com'
});

// 更新资源
const updatedUser = await client.update(operation, '123', userData);

// 删除资源
await client.delete(operation, '123');
```

## 统一服务接口

### OpenAPIService

整合三个核心服务，提供统一的接口。

```typescript
import { createOpenAPIService } from '@/lib/api';

// 创建服务实例
const apiService = createOpenAPIService('https://api.example.com');

// 初始化（解析 OpenAPI 文档）
await apiService.initialize('https://api.example.com/openapi.json');

// 获取文档信息
const docInfo = apiService.getDocumentInfo();

// 获取资源表单 schema
const formSchema = apiService.getResourceFormSchema('users', {
  excludeFields: ['id', 'created_at']
});

// 获取资源表格 schema
const tableSchema = apiService.getResourceTableSchema('users');

// 设置认证
apiService.setAuth('your-token');

// 获取客户端进行 API 调用
const client = apiService.getClient();
```

## 错误处理

```typescript
try {
  const response = await client.create(operation, userData);
} catch (error) {
  if (client.isValidationError(error)) {
    // 处理验证错误
    console.log('Validation errors:', error.validationErrors);
  } else if (client.isAuthError(error)) {
    // 处理认证错误
    console.log('Authentication required');
  } else if (client.isNetworkError(error)) {
    // 处理网络错误
    console.log('Network connection failed');
  } else if (client.isServerError(error)) {
    // 处理服务器错误
    console.log('Server error occurred');
  }
}
```

## 与 React JSONSchema Form 集成

```tsx
import Form from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';

function UserCreateForm() {
  const [formSchema, setFormSchema] = useState(null);
  
  useEffect(() => {
    async function loadSchema() {
      const schema = apiService.getResourceFormSchema('users');
      setFormSchema(schema);
    }
    loadSchema();
  }, []);

  const handleSubmit = async ({ formData }) => {
    try {
      const operation = apiService.getParser().getOperationInfo('POST', '/users');
      const response = await apiService.getClient().create(operation, formData);
      console.log('User created:', response.data);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (!formSchema) return <div>Loading...</div>;

  return (
    <Form
      schema={formSchema.schema}
      uiSchema={formSchema.uiSchema}
      formData={formSchema.formData}
      validator={validator}
      onSubmit={handleSubmit}
    />
  );
}
```

## 与 Ant Design Table 集成

```tsx
import { Table } from 'antd';

function UserTable() {
  const [tableSchema, setTableSchema] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSchema() {
      const schema = apiService.getResourceTableSchema('users');
      setTableSchema(schema);
    }
    loadSchema();
  }, []);

  const fetchData = async (pagination, filters, sorter) => {
    setLoading(true);
    try {
      const operation = apiService.getParser().getOperationInfo('GET', '/users');
      const response = await apiService.getClient().getList(operation, {
        page: pagination.current,
        pageSize: pagination.pageSize,
        sort: sorter.field,
        order: sorter.order === 'ascend' ? 'asc' : 'desc',
        filters
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!tableSchema) return <div>Loading...</div>;

  return (
    <Table
      columns={tableSchema.columns}
      dataSource={data}
      loading={loading}
      pagination={tableSchema.pagination}
      onChange={fetchData}
    />
  );
}
```

## 优势

1. **标准化**：基于 OpenAPI 规范和社区标准库
2. **类型安全**：使用 TypeScript 和 openapi-types
3. **自动化**：自动生成表单和表格 schema
4. **可扩展**：模块化设计，易于扩展和定制
5. **错误处理**：完善的错误分类和处理机制
6. **缓存优化**：智能缓存减少重复解析

## 测试

```bash
# 运行测试
npm run test

# 运行特定测试文件
npm run test app/lib/api/__tests__/api-services.test.ts
```

## 迁移指南

从旧的自定义解析逻辑迁移到新架构：

1. **替换解析器**：使用 `OpenAPIDocumentParser` 替代 `OpenAPIParser`
2. **更新 Schema 生成**：使用 `SchemaRenderer` 生成 RJSF 兼容的 schema
3. **重构 API 调用**：使用 `RESTfulAPIClient` 处理所有 HTTP 请求
4. **统一服务接口**：使用 `OpenAPIService` 作为单一入口点

新架构与旧代码的主要差异：

- 使用社区标准的数据类型而非自定义类型
- 基于 OpenAPI 规范进行参数验证
- 自动处理常见的响应格式
- 提供更好的错误处理和类型安全
