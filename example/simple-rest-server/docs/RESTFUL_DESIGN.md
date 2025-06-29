# RESTful API 设计规范总结

这个Simple REST Server项目完全按照RESTful架构原则设计，是一个理想的RESTful API演示服务。

## 📋 RESTful设计原则遵循

### 1. 资源导向 (Resource-Oriented)
- ✅ 所有URL都代表资源：`/api/authors`, `/api/books`, `/api/notes`
- ✅ 使用名词而不是动词：使用 `/authors` 而不是 `/getAuthors`
- ✅ 层次化的资源结构：`/authors/{id}/books`

### 2. HTTP方法语义化
- ✅ `GET` - 获取资源（幂等、安全）
- ✅ `POST` - 创建资源（非幂等）
- ✅ `PUT` - 更新资源（幂等）
- ✅ `DELETE` - 删除资源（幂等）

### 3. 状态码规范
- ✅ `200 OK` - 成功获取/更新
- ✅ `201 Created` - 成功创建
- ✅ `204 No Content` - 成功删除
- ✅ `400 Bad Request` - 请求参数错误
- ✅ `404 Not Found` - 资源不存在
- ✅ `500 Internal Server Error` - 服务器错误

### 4. 统一的响应格式
```json
// 单个资源
{
  "id": "uuid",
  "name": "资源名称",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// 资源列表（带分页）
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}

// 错误响应
{
  "error": "Error Type",
  "message": "详细描述",
  "details": [...]
}
```

### 5. 无状态性
- ✅ 每个请求包含所有必要信息
- ✅ 服务器不保存客户端状态
- ✅ 使用参数传递过滤条件

### 6. 可缓存性
- ✅ GET请求是幂等和安全的
- ✅ 适当的HTTP头设置
- ✅ 支持条件请求（可扩展）

## 🗂️ 资源设计

### Authors（作者）资源
```
GET    /api/authors           # 获取作者列表
GET    /api/authors/{id}      # 获取指定作者
POST   /api/authors           # 创建新作者
PUT    /api/authors/{id}      # 更新作者信息
DELETE /api/authors/{id}      # 删除作者
GET    /api/authors/{id}/books # 获取作者的书籍
```

### Books（书籍）资源
```
GET    /api/books             # 获取书籍列表
GET    /api/books/{id}        # 获取指定书籍
POST   /api/books             # 创建新书籍
PUT    /api/books/{id}        # 更新书籍信息
DELETE /api/books/{id}        # 删除书籍
GET    /api/books/{id}/notes  # 获取书籍的笔记
```

### Notes（笔记）资源
```
GET    /api/notes             # 获取笔记列表
GET    /api/notes/{id}        # 获取指定笔记
POST   /api/notes             # 创建新笔记
PUT    /api/notes/{id}        # 更新笔记信息
DELETE /api/notes/{id}        # 删除笔记
```

## 🔍 查询和过滤

### 分页参数
- `limit` - 限制返回数量（默认10，最大100）
- `offset` - 偏移量（默认0）

### 过滤参数
- Authors: `name`, `email`
- Books: `title`, `authorId`, `genre`
- Notes: `title`, `bookId`, `authorId`, `tags`

### 使用示例
```bash
# 分页查询
GET /api/books?limit=20&offset=40

# 条件过滤
GET /api/books?genre=科幻&authorId=123

# 复合查询
GET /api/notes?tags=读书,学习&limit=5
```

## 🛡️ 数据验证

### 输入验证
- ✅ 必填字段验证
- ✅ 数据类型验证
- ✅ 格式验证（如邮箱、日期）
- ✅ 长度限制验证

### 业务逻辑验证
- ✅ 唯一性检查（如邮箱、ISBN）
- ✅ 外键关联验证
- ✅ 数据一致性检查

## 📚 OpenAPI文档

### 自动生成的文档包含
- ✅ 完整的API端点描述
- ✅ 请求/响应模型定义
- ✅ 参数说明和验证规则
- ✅ 错误响应说明
- ✅ 交互式API测试界面

### 访问方式
- Swagger UI: `http://localhost:3000/api-docs`
- JSON格式: 通过 `npm run docs` 生成

## 🧪 测试覆盖

### 单元测试
- ✅ CRUD操作测试
- ✅ 数据验证测试
- ✅ 错误处理测试
- ✅ 边界条件测试

### 性能测试
- ✅ 大数据量处理
- ✅ 并发请求处理
- ✅ 响应时间测试

### 运行测试
```bash
npm test              # 运行所有测试
npm run test:watch    # 监听模式
npm run test:coverage # 生成覆盖率报告
```

## 🚀 部署和运维

### 健康检查
```bash
GET /health
```

### 服务信息
```bash
GET /
```

### 环境配置
- 支持环境变量配置
- 开发/生产环境区分
- 可配置端口和CORS设置

## 🎯 最佳实践应用

### 1. API版本控制（可扩展）
- URL版本控制: `/api/v1/authors`
- 头部版本控制: `Accept: application/vnd.api+json;version=1`

### 2. 认证授权（可扩展）
- JWT Token认证
- 基于角色的访问控制
- API密钥管理

### 3. 限流和监控（可扩展）
- 请求频率限制
- API使用统计
- 性能监控

### 4. 缓存策略（可扩展）
- ETag支持
- 条件请求
- 缓存失效策略

## 📊 性能特征

### 当前实现
- 内存存储，适合演示和开发
- 支持并发访问
- 快速响应时间

### 生产环境建议
- 数据库持久化存储
- 连接池管理
- 缓存层（Redis）
- 负载均衡
- 监控和日志

## 🔄 扩展建议

### 1. 数据层改进
- 支持多种数据库（MySQL、PostgreSQL、MongoDB）
- 数据库迁移和版本控制
- 连接池和事务管理

### 2. 业务逻辑扩展
- 更复杂的资源关系
- 业务规则引擎
- 工作流支持

### 3. 技术栈升级
- TypeScript支持
- 微服务架构
- 容器化部署
- CI/CD集成

这个Simple REST Server展示了如何构建一个完全符合RESTful规范的API服务，可以作为学习、演示和原型开发的理想基础。
