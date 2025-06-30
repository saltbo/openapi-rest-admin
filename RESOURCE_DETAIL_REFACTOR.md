# 资源详情页重构文档

## 重构概述

本次重构将原来的单一 `useResourceDetailAPI` hook 拆解为多个独立的组件和 hooks，实现了更好的关注点分离和组件自闭环。

## 重构前后对比

### 重构前
- 单一的 `useResourceDetailAPI` hook 包含所有逻辑
- 组件依赖外部传入的数据
- 数据获取逻辑集中在父组件

### 重构后
- 数据获取逻辑分散到各个组件内部
- 每个组件都是自闭环的，独立管理自己的状态
- 提供了可重用的自定义 hooks

## 新增文件结构

```
app/
├── hooks/
│   ├── useResourceDetail.ts          # 单个资源详情数据管理
│   └── useSubResources.ts            # 子资源列表数据管理
├── components/shared/
│   ├── ResourceInfoCard.tsx          # 重构后的资源信息卡片
│   └── SubResourcesList.tsx          # 重构后的子资源列表
└── pages/api-explorer/components/
    └── ResourceDetail.tsx             # 重构后的详情页主组件
```

## 关键改进点

### 1. 组件自闭环
每个组件现在都能独立工作：

#### ResourceInfoCard
- 接收基本参数（serviceName, resourceName, itemId 等）
- 内部处理数据获取、状态管理
- 提供回调函数与父组件通信

#### SubResourcesList  
- 独立管理子资源数据获取
- 内置加载状态和错误处理
- 支持增删改查操作

### 2. 自定义 Hooks 拆分
原来的大型 hook 被拆分为：

#### useResourceDetail
```typescript
const { loading, error, currentItem, resource, apiConfig, refetch } = useResourceDetail({
  serviceName,
  resourceName, 
  itemId,
  nestedPath
});
```

#### useSubResources
```typescript
const { loading, error, subResources, subResourceData, refetch } = useSubResources({
  serviceName,
  resourceName,
  itemId, 
  nestedPath
});
```

### 3. 组件接口优化

#### 新的 ResourceInfoCard 接口
```typescript
interface ResourceInfoCardProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  apiId?: string;
  onDeleteSuccess?: () => void;
  onDataLoaded?: (data: any) => void;  // 新增数据加载回调
}
```

#### 新的 SubResourcesList 接口
```typescript
interface SubResourcesListProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  onItemClick: (subResourceName: string, record: any) => void;
  onCreateNew: (subResourceName: string) => void;
  apiId?: string;
}
```

## 最佳实践体现

### 1. 单一职责原则
- 每个组件只负责自己的功能域
- ResourceInfoCard 只处理资源详情
- SubResourcesList 只处理子资源列表

### 2. 依赖倒置
- 组件不再依赖外部传入的复杂数据结构
- 通过简单参数和服务接口获取数据

### 3. 状态管理本地化
- 每个组件管理自己的加载状态、错误状态
- 减少了父组件的状态管理复杂度

### 4. 可复用性提升
- 组件可以在不同场景下独立使用
- 通过 props 配置不同的行为

### 5. 测试友好
- 每个组件都可以独立测试
- Mock 依赖更加简单

## 使用示例

### 独立使用 ResourceInfoCard
```tsx
<ResourceInfoCard
  serviceName="my-api"
  resourceName="users"
  itemId="123"
  onDeleteSuccess={() => navigate('/users')}
  onDataLoaded={(data) => console.log('Data loaded:', data)}
/>
```

### 独立使用 SubResourcesList
```tsx
<SubResourcesList
  serviceName="my-api"
  resourceName="users"
  itemId="123"
  onItemClick={(subResource, record) => navigate(`/users/123/${subResource}/${record.id}`)}
  onCreateNew={(subResource) => navigate(`/users/123/${subResource}/new`)}
/>
```

### 使用自定义 Hooks
```tsx
function MyComponent() {
  const { loading, currentItem, refetch } = useResourceDetail({
    serviceName: 'my-api',
    resourceName: 'users',
    itemId: '123'
  });

  if (loading) return <Spin />;
  
  return <div>{JSON.stringify(currentItem)}</div>;
}
```

## 迁移指南

如果你有其他页面在使用旧的 `useResourceDetailAPI`，可以按以下步骤迁移：

1. 替换 import 语句
2. 更新组件 props 传递方式
3. 利用新的回调机制处理数据通信

## 性能优化

### 1. 按需加载
- 组件只在需要时才发起数据请求
- 避免了不必要的数据获取

### 2. 独立缓存
- 每个组件可以独立实现数据缓存
- 避免了全局状态的复杂性

### 3. 错误隔离
- 单个组件的错误不会影响其他组件
- 提供了更好的用户体验

这次重构遵循了React和前端开发的最佳实践，提高了代码的可维护性、可测试性和可复用性。
