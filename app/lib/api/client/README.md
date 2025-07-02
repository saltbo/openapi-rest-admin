# Resource Operation Client

这个目录包含了重构后的资源操作客户端，原来的大文件 `RESTfulAPIClient.ts` 已经被拆分成多个专注的模块。

## 目录结构

```
client/
├── index.ts                      # 客户端模块入口，导出所有公共接口
├── ResourceOperationClient.ts    # 主客户端类
├── types/
│   └── index.ts                  # 类型定义和接口
├── core/
│   ├── index.ts                  # 核心模块入口
│   ├── RequestBuilder.ts         # 请求构建器
│   ├── ResponseParser.ts         # 响应解析器
│   ├── OperationHelper.ts        # 操作判断器
│   └── ErrorHandler.ts           # 错误处理器
└── transformers/
    ├── index.ts                  # 转换器模块入口
    └── ResponseTransformer.ts    # 响应数据转换器
```

## 模块说明

### 主客户端 (`ResourceOperationClient.ts`)
- 整合所有功能模块
- 提供高级API接口
- 处理认证和配置管理

### 类型定义 (`types/`)
- 包含所有接口和类型定义
- APIError 错误类
- 请求/响应相关的类型

### 核心模块 (`core/`)
- **RequestBuilder**: 负责构建HTTP请求的URL和选项
- **ResponseParser**: 负责解析HTTP响应并处理错误
- **OperationHelper**: 负责判断资源操作的类型
- **ErrorHandler**: 负责处理和分类各种API错误

### 转换器 (`transformers/`)
- **ResponseTransformer**: 负责将API响应数据转换为标准格式
- 处理列表数据和分页信息的提取
- 处理单个资源数据的提取

## 使用方式

使用方式保持不变，可以直接从主入口导入：

```typescript
import { ResourceOperationClient, RESTfulAPIClient } from '~/lib/api';

// 或者从客户端模块导入
import { ResourceOperationClient } from '~/lib/api/client';
```

## 优势

1. **关注点分离**: 每个模块都有明确的职责
2. **更好的维护性**: 代码更容易理解和修改
3. **更好的测试性**: 每个模块可以独立测试
4. **向后兼容**: 保持原有的公共API不变
5. **可扩展性**: 容易添加新功能或修改现有功能
