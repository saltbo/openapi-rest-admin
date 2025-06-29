# Simple REST Server

这是一个标准的RESTful演示服务，完全按照RESTful规范来抽象资源。该服务提供了Authors（作者）、Books（书籍）、Notes（笔记）等资源的完整CRUD操作，并生成标准的OpenAPI文档。

## 🚀 特性

- ✅ 完全符合RESTful规范的API设计
- 📚 包含Authors、Books、Notes三种资源
- 📖 自动生成OpenAPI 3.0文档
- 🔍 支持资源过滤和分页
- ✨ 完整的数据验证
- 🧪 包含单元测试
- 💾 内存数据存储（用于演示）

## 📋 资源模型

### Authors（作者）
- `id`: 唯一标识符
- `name`: 作者姓名 *（必填）*
- `email`: 邮箱地址 *（必填）*
- `bio`: 作者简介
- `birthDate`: 出生日期
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Books（书籍）
- `id`: 唯一标识符
- `title`: 书籍标题 *（必填）*
- `authorId`: 作者ID *（必填）*
- `isbn`: ISBN号码
- `genre`: 书籍类型
- `publishedDate`: 出版日期
- `description`: 书籍描述
- `price`: 价格
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Notes（笔记）
- `id`: 唯一标识符
- `title`: 笔记标题 *（必填）*
- `content`: 笔记内容 *（必填）*
- `tags`: 标签数组
- `bookId`: 关联的书籍ID
- `authorId`: 笔记作者ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## 🛠️ 安装和运行

### 前置要求
- Node.js (版本 14 或更高)
- npm

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **或者启动生产服务器**
```bash
npm start
```

4. **使用启动脚本**
```bash
chmod +x start.sh
./start.sh
```

服务器默认运行在 `http://localhost:3000`

## 📖 API文档

启动服务器后，可以通过以下地址访问：

- **Swagger UI文档**: `http://localhost:3000/api-docs`
- **健康检查**: `http://localhost:3000/health`
- **根路径**: `http://localhost:3000`

## 🔗 API端点

### Authors（作者）API
```
GET    /api/authors           # 获取所有作者（支持分页和过滤）
GET    /api/authors/:id       # 获取指定作者详情
POST   /api/authors           # 创建新作者
PUT    /api/authors/:id       # 更新作者信息
DELETE /api/authors/:id       # 删除作者
GET    /api/authors/:id/books # 获取作者的所有书籍
```

### Books（书籍）API
```
GET    /api/books             # 获取所有书籍（支持分页和过滤）
GET    /api/books/:id         # 获取指定书籍详情
POST   /api/books             # 创建新书籍
PUT    /api/books/:id         # 更新书籍信息
DELETE /api/books/:id         # 删除书籍
GET    /api/books/:id/notes   # 获取书籍的所有笔记
```

### Notes（笔记）API
```
GET    /api/notes             # 获取所有笔记（支持分页和过滤）
GET    /api/notes/:id         # 获取指定笔记详情
POST   /api/notes             # 创建新笔记
PUT    /api/notes/:id         # 更新笔记信息
DELETE /api/notes/:id         # 删除笔记
```

## 🧪 测试

运行单元测试：
```bash
npm test
```

运行API演示脚本：
```bash
chmod +x examples/api-demo.sh
./examples/api-demo.sh
```

## 📝 使用示例

### 创建作者
```bash
curl -X POST http://localhost:3000/api/authors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "鲁迅",
    "email": "luxun@example.com",
    "bio": "现代文学家",
    "birthDate": "1881-09-25"
  }'
```

### 获取所有作者（带分页）
```bash
curl "http://localhost:3000/api/authors?limit=10&offset=0"
```

### 搜索书籍
```bash
curl "http://localhost:3000/api/books?genre=古典文学&limit=5"
```

### 按标签搜索笔记
```bash
curl "http://localhost:3000/api/notes?tags=读后感,古典文学"
```

## 🏗️ 项目结构

```
simple-rest-server/
├── src/
│   ├── index.js           # 应用入口和配置
│   ├── store.js           # 内存数据存储
│   └── routes/
│       ├── authors.js     # 作者路由
│       ├── books.js       # 书籍路由
│       └── notes.js       # 笔记路由
├── tests/
│   └── authors.test.js    # 单元测试
├── examples/
│   └── api-demo.sh        # API使用示例
├── package.json
├── start.sh               # 启动脚本
├── .env.example           # 环境变量示例
└── README.md
```

## 🔧 配置

复制 `.env.example` 到 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

可配置项：
- `PORT`: 服务器端口（默认：3000）
- `NODE_ENV`: 运行环境（development/production）

## 🤝 RESTful设计原则

这个服务严格遵循RESTful设计原则：

1. **资源导向**: 每个URL代表一种资源
2. **HTTP动词**: 使用标准HTTP方法（GET、POST、PUT、DELETE）
3. **无状态**: 每个请求都包含处理请求所需的所有信息
4. **统一接口**: 一致的API设计和响应格式
5. **分层系统**: 清晰的代码组织结构
6. **缓存**: 适当的HTTP缓存头（可扩展）

## 📊 响应格式

### 成功响应
```json
{
  "id": "uuid",
  "name": "资源名称",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### 列表响应（带分页）
```json
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### 错误响应
```json
{
  "error": "Error Type",
  "message": "详细错误描述",
  "details": [...]
}
```

## 🎯 适用场景

这个服务适合用于：

- RESTful API设计学习和演示
- API开发最佳实践展示
- OpenAPI文档生成示例
- 前端应用的后端模拟服务
- 微服务架构的原型开发

## 📄 许可证

MIT License

