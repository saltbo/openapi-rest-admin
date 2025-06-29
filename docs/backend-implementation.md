# OpenAPI Admin 后端实现文档

## 概述

本项目现在使用 Prisma ORM 实现了完整的后端逻辑，支持对 API 配置的动态管理。系统采用 SQLite 数据库（可轻松切换到其他数据库），通过 React Router v7 的全栈功能提供完整的 CRUD 操作。

## 技术栈

- **ORM**: Prisma
- **数据库**: SQLite (可扩展到 PostgreSQL、MySQL 等)
- **后端框架**: React Router v7
- **类型系统**: TypeScript

## 项目结构

```
app/
├── services/
│   ├── database.ts          # Prisma 客户端配置
│   ├── api-config.ts        # API 配置数据库服务
│   └── api.ts              # 业务逻辑服务层
├── routes/
│   ├── api.configs.$.tsx    # RESTful API 路由
│   ├── api.stats.tsx       # 统计信息 API
│   ├── api.search.tsx      # 搜索 API
│   └── admin/
│       ├── apis.tsx        # 管理页面路由
│       └── api-detail.tsx  # 详情页面路由
├── types/
│   └── api.ts              # 类型定义
prisma/
├── schema.prisma           # 数据库 Schema
└── dev.db                 # SQLite 数据库文件
scripts/
├── migrate.ts             # 数据迁移脚本
└── test-api.ts           # 测试脚本
```

## 数据模型

### APIConfig 模型

```prisma
model APIConfig {
  id          String   @id
  name        String
  description String
  openapiUrl  String   @map("openapi_url")
  enabled     Boolean  @default(true)
  tags        String?  // JSON 字符串
  version     String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("api_configs")
}
```

## API 接口

### RESTful API 端点

#### 1. 获取 API 配置
```typescript
GET /api/configs           // 获取所有配置
GET /api/configs?enabled=true  // 获取启用的配置
GET /api/configs/:id       // 获取单个配置
```

#### 2. 创建 API 配置
```typescript
POST /api/configs
Content-Type: application/json

{
  "id": "new-api",
  "name": "新的 API",
  "description": "API 描述",
  "openapiUrl": "http://example.com/openapi.json",
  "enabled": true,
  "tags": ["tag1", "tag2"],
  "version": "1.0.0"
}
```

#### 3. 更新 API 配置
```typescript
PUT /api/configs/:id
Content-Type: application/json

{
  "name": "更新的名称",
  "description": "更新的描述",
  "enabled": false
}
```

#### 4. 删除 API 配置
```typescript
DELETE /api/configs/:id
```

#### 5. 批量操作
```typescript
PATCH /api/configs
Content-Type: application/json

{
  "action": "updateStatus",
  "ids": ["api1", "api2"],
  "data": { "enabled": false }
}
```

#### 6. 统计信息
```typescript
GET /api/stats

// 响应
{
  "data": {
    "total": 10,
    "enabled": 8,
    "disabled": 2
  },
  "success": true
}
```

#### 7. 搜索
```typescript
GET /api/search?tags=demo,test

// 响应
{
  "data": [...],
  "success": true
}
```

## 服务层架构

### 1. 数据库服务层 (`api-config.ts`)

负责所有与数据库交互的操作：

```typescript
export class APIConfigService {
  async getAllConfigs(): Promise<APIConfig[]>
  async getEnabledConfigs(): Promise<APIConfig[]>
  async getConfigById(id: string): Promise<APIConfig | null>
  async createConfig(input: CreateAPIConfigInput): Promise<APIConfig>
  async updateConfig(id: string, input: UpdateAPIConfigInput): Promise<APIConfig | null>
  async deleteConfig(id: string): Promise<boolean>
  async configExists(id: string): Promise<boolean>
  async updateMultipleConfigsStatus(ids: string[], enabled: boolean): Promise<number>
  async searchConfigsByTags(tags: string[]): Promise<APIConfig[]>
  async getConfigStats(): Promise<{ total: number; enabled: number; disabled: number }>
}
```

### 2. 业务逻辑服务层 (`api.ts`)

在数据库服务基础上提供业务逻辑：

```typescript
export class APIService {
  async getAPIConfigs(): Promise<APIResponse<APIConfig[]>>
  async getAPIConfig(id: string): Promise<APIResponse<APIConfig>>
  async getOpenAPIAnalysis(apiId: string): Promise<APIResponse<OpenAPIAnalysis>>
  async createAPIConfig(input: CreateAPIConfigInput): Promise<APIResponse<APIConfig>>
  async updateAPIConfig(id: string, updates: UpdateAPIConfigInput): Promise<APIResponse<APIConfig>>
  async deleteAPIConfig(id: string): Promise<APIResponse<void>>
}
```

## 路由实现

### 1. API 路由 (Server-Side)

```typescript
// app/routes/api.configs.$.tsx
export async function loader({ params, request }: LoaderFunctionArgs) {
  // 处理 GET 请求
}

export async function action({ request, params }: ActionFunctionArgs) {
  // 处理 POST/PUT/DELETE/PATCH 请求
}
```

### 2. 页面路由 (Full-Stack)

```typescript
// app/routes/admin/apis.tsx
export async function loader({}: Route.LoaderArgs) {
  // 服务端数据加载
  const configs = await apiConfigService.getAllConfigs();
  return { configs };
}

export async function action({ request }: Route.ActionArgs) {
  // 服务端表单处理
  const formData = await request.formData();
  // 处理创建、更新、删除操作
}
```

## 数据迁移

### 从配置文件迁移到数据库

```bash
# 运行迁移脚本
npm run db:migrate
```

迁移脚本会：
1. 清空现有数据库数据
2. 将 `config/apis.ts` 中的配置导入数据库
3. 验证数据完整性

## 数据库管理命令

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送 Schema 到数据库
npm run db:push

# 运行数据迁移
npm run db:migrate

# 打开 Prisma Studio（可视化数据库管理）
npm run db:studio
```

## 环境配置

### 数据库连接

在 `.env` 文件中配置数据库连接：

```env
# SQLite (开发环境)
DATABASE_URL="file:./dev.db"

# PostgreSQL (生产环境)
# DATABASE_URL="postgresql://user:password@localhost:5432/openapi_admin"

# MySQL (生产环境)
# DATABASE_URL="mysql://user:password@localhost:3306/openapi_admin"
```

## 切换数据库类型

Prisma 支持多种数据库，切换方法：

### 1. 更新 Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // 或 "mysql", "sqlserver" 等
  url      = env("DATABASE_URL")
}
```

### 2. 更新环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/openapi_admin"
```

### 3. 重新生成和推送

```bash
npm run db:generate
npm run db:push
npm run db:migrate
```

## 测试

### 运行测试

```bash
# 运行完整的服务测试
npx tsx scripts/test-api.ts
```

测试内容包括：
- CRUD 操作
- 搜索功能
- 统计信息
- 批量操作

## 性能优化

### 1. 数据库索引

```prisma
model APIConfig {
  // ...fields...
  
  @@index([enabled])
  @@index([tags])
  @@index([createdAt])
}
```

### 2. 连接池

```typescript
// app/services/database.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  // 连接池配置
  log: ['query', 'info', 'warn', 'error'],
});
```

### 3. 缓存策略

在业务逻辑层实现缓存：

```typescript
class APIService {
  private cache = new Map();
  
  async getAPIConfig(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    // 获取数据并缓存
  }
}
```

## 部署注意事项

### 1. 生产环境数据库

建议在生产环境使用 PostgreSQL 或 MySQL：

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### 2. 数据库迁移

在部署时确保运行数据库迁移：

```bash
npx prisma generate
npx prisma db push
```

### 3. 环境变量

确保生产环境正确设置：
- `DATABASE_URL`
- `NODE_ENV=production`

## 监控和日志

### 1. 数据库查询日志

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### 2. 错误监控

```typescript
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 业务逻辑
  } catch (error) {
    console.error('API Error:', error);
    // 发送到错误监控服务
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## 安全考虑

### 1. 输入验证

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const data = await request.json();
  
  // 验证必填字段
  if (!data.id || !data.name || !data.openapiUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  // 验证 URL 格式
  try {
    new URL(data.openapiUrl);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }
}
```

### 2. SQL 注入防护

Prisma 自动防护 SQL 注入攻击，但仍需注意：

```typescript
// ✅ 安全 - 使用 Prisma 查询
await prisma.aPIConfig.findMany({
  where: { name: { contains: searchTerm } }
});

// ❌ 危险 - 原生 SQL
await prisma.$queryRaw`SELECT * FROM api_configs WHERE name LIKE ${searchTerm}`;
```

## 总结

通过这个完整的后端实现，我们现在拥有：

1. **完整的 CRUD 操作**：创建、读取、更新、删除 API 配置
2. **类型安全**：完整的 TypeScript 类型定义
3. **数据库抽象**：使用 Prisma ORM，支持多种数据库
4. **RESTful API**：标准的 REST 接口设计
5. **全栈集成**：React Router v7 的 loader/action 机制
6. **数据迁移**：从配置文件到数据库的平滑迁移
7. **测试覆盖**：完整的功能测试
8. **扩展性**：易于添加新功能和切换数据库

这个实现为项目提供了坚实的后端基础，支持未来的功能扩展和生产环境部署。
