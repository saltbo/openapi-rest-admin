# 配置系统使用指南

## 概述

项目现在使用React Context来管理配置，让所有组件都能方便地访问配置信息。

## 架构设计

1. **App组件接收配置**: App组件接收`RuntimeConfig`参数
2. **ConfigProvider包装**: 使用`ConfigProvider`包装整个应用
3. **Hook访问**: 子组件通过hooks访问配置

## 使用方法

### 1. 在组件中获取完整配置

```tsx
import { useAppConfig } from '~/config';

function MyComponent() {
  const config = useAppConfig();
  
  return <div>{config.siteTitle}</div>;
}
```

### 2. 获取特定配置值（推荐）

```tsx
import { useAppConfigValue } from '~/config';

function MyComponent() {
  const siteTitle = useAppConfigValue('siteTitle');
  const openapiDocUrl = useAppConfigValue('openapiDocUrl');
  
  return (
    <div>
      <h1>{siteTitle}</h1>
      <p>API文档: {openapiDocUrl}</p>
    </div>
  );
}
```

### 3. 类型安全

`useAppConfigValue` hook提供完整的TypeScript类型支持：

```tsx
// ✅ 正确 - key必须是RuntimeConfig的有效键
const title = useAppConfigValue('siteTitle');

// ❌ 错误 - TypeScript会报错
const invalid = useAppConfigValue('invalidKey');
```

## 配置流程

1. **App组件**接收配置参数
2. **ConfigProvider**将配置传递给Context
3. **所有子组件**都可以通过hooks访问配置
4. **Layout组件**包含QueryClient和AuthProvider等全局providers

## 文件结构

```
app/config/
├── ConfigContext.tsx    # 配置Context和hooks
├── config.ts           # 默认配置创建函数
├── types.ts            # 配置类型定义
└── index.ts            # 统一导出
```

## 与运行时配置的区别

- `useAppConfig/useAppConfigValue`: 获取应用启动时传入的配置（同步）
- `useRuntimeConfig`: 从`/config.json`动态获取配置（异步）

根据需要选择合适的hook。

## 最佳实践

1. **优先使用`useAppConfigValue`**: 类型安全且性能更好
2. **在需要多个配置值时使用`useAppConfig`**: 避免多次调用hook
3. **配置Provider应该尽可能包装在顶层**: 确保所有组件都能访问

## 示例

参考 `app/components/shared/ConfigExample.tsx` 查看完整的使用示例。
