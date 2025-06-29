# API 配置管理系统

这是一个基于 React Router v7 + Prisma + SQLite 的 API 配置管理系统，支持动态管理 OpenAPI 配置。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装和运行
```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npm run db:generate

# 推送数据库 schema
npm run db:push

# 导入初始数据（如果需要）
npm run db:migrate

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
app/
├── components/          # 可复用组件
├── hooks/              # 自定义 hooks
├── pages/              # 页面组件
│   ├── admin/          # 管理后台页面
│   └── frontend/       # 前台页面
├── routes/             # 路由处理器
│   ├── admin/          # 管理后台路由
│   ├── frontend/       # 前台路由
│   └── api/            # API 路由
├── services/           # 业务逻辑服务
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数

config/                 # 配置文件
prisma/                 # 数据库 schema 和迁移
scripts/                # 实用脚本
```

## 🔧 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run db:generate` - 生成 Prisma 客户端
- `npm run db:push` - 推送数据库 schema
- `npm run db:migrate` - 运行数据迁移
- `npm run db:reset` - 重置数据库并导入默认数据
- `npm run db:studio` - 打开 Prisma Studio

## 🎯 核心功能

### API 配置管理
- ✅ 创建、读取、更新、删除 API 配置
- ✅ 批量操作（启用/禁用）
- ✅ 标签管理
- ✅ 状态控制
- ✅ 统计信息

### 前端界面
- 📊 统计面板显示配置概览
- 📝 完整的表单编辑功能
- 🔍 详情查看和搜索
- ⚡ 实时状态切换
- 📱 响应式设计

### API 接口
- `GET /api/configs` - 获取所有配置
- `GET /api/configs/:id` - 获取单个配置
- `POST /api/configs` - 创建新配置
- `PUT /api/configs/:id` - 更新配置
- `DELETE /api/configs/:id` - 删除配置
- `PATCH /api/configs` - 批量操作
- `GET /api/stats` - 获取统计信息

## 🗄️ 数据库

使用 SQLite 作为默认数据库，支持：
- APIConfig 表存储 API 配置信息
- 自动时间戳（创建时间、更新时间）
- JSON 字段存储标签数组
- 唯一约束确保 ID 不重复

## 🔄 数据迁移

从静态配置文件迁移到数据库：
```bash
npm run db:migrate
```

重置数据库到初始状态：
```bash
npm run db:reset
```

## 🌐 访问地址

- 前台首页: http://localhost:5173
- 管理后台: http://localhost:5173/admin/apis
- API 接口: http://localhost:5173/api/*
- 数据库管理: npm run db:studio

## 📝 开发指南

### 添加新的 API 配置

1. **通过前端界面**：
   - 访问 `/admin/apis`
   - 点击"新增配置"
   - 填写表单并提交

2. **通过 API**：
   ```bash
   curl -X POST http://localhost:5173/api/configs \
     -H "Content-Type: application/json" \
     -d '{
       "id": "my-api",
       "name": "My API",
       "description": "My API description",
       "openapiUrl": "https://example.com/openapi.json",
       "enabled": true,
       "tags": ["tag1", "tag2"],
       "version": "v1.0.0"
     }'
   ```

### 扩展功能

1. **添加新字段**：
   - 更新 `prisma/schema.prisma`
   - 更新类型定义 `app/types/api.ts`
   - 更新服务层 `app/services/api-config.ts`
   - 更新前端表单

2. **添加新路由**：
   - 在 `app/routes/` 下创建新文件
   - 在 `app/routes.ts` 中注册路由

## 🔒 最佳实践

- 所有数据库操作都通过服务层进行
- 前端组件使用 React Router 的 loader/action 机制
- API 路由返回标准的 HTTP 状态码
- 使用 TypeScript 确保类型安全
- 遵循 RESTful API 设计原则
