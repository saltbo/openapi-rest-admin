# 认证系统重构

## 概述

此次重构优化了认证相关代码的结构和可维护性，主要改进包括：

## 主要改进

### 1. 统一状态管理
- **AuthContext**: 集中管理所有认证状态（用户信息、加载状态、错误状态）
- 移除了组件间重复的状态管理逻辑
- 使用 `useCallback` 优化性能，避免不必要的重渲染

### 2. 简化错误处理
- 统一的错误处理机制
- 新增 `useAuthError` Hook 自动显示错误消息
- 错误消息常量化管理

### 3. 代码结构优化
- 移除复杂的轮询检查逻辑
- 简化事件监听器管理
- 统一的返回URL处理逻辑

### 4. 类型安全增强
- 完善的 TypeScript 类型定义
- 更严格的上下文使用检查

## 核心组件

### AuthContext
```tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
```

### 主要功能
- `login()`: 保存当前URL并启动OIDC登录流程
- `logout()`: 清理状态并启动登出流程
- `error` + `clearError()`: 统一的错误状态管理

### 使用方式

```tsx
// 1. 基本使用
const { user, isAuthenticated, loading, login, logout } = useAuth();

// 2. 自动错误处理
import { useAuthError } from '../../hooks/useAuthError';

function MyComponent() {
  const { login } = useAuth();
  useAuthError(); // 自动显示错误消息
  
  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      // 错误已在上下文中处理
    }
  };
}
```

## 最佳实践

1. **统一错误处理**: 使用 `useAuthError` Hook
2. **避免重复状态**: 通过 AuthContext 获取认证状态
3. **类型安全**: 确保在 AuthProvider 内使用 `useAuth`
4. **性能优化**: 已使用 `useCallback` 和 `useMemo` 优化

## 迁移指南

如果你的组件之前直接使用 `getAuthService()`，现在应该：

```tsx
// 之前
const authService = getAuthService();
const [user, setUser] = useState(null);

// 现在
const { user, isAuthenticated, login, logout } = useAuth();
```

## 文件结构

```
app/
├── components/auth/
│   ├── AuthContext.tsx     # 主要认证上下文
│   ├── LoginButton.tsx     # 登录按钮组件
│   ├── ProtectedRoute.tsx  # 路由保护组件
│   └── index.ts           # 导出文件
├── pages/auth/
│   ├── Login.tsx          # 登录页面
│   └── AuthCallback.tsx   # OIDC回调处理
├── hooks/
│   └── useAuthError.ts    # 错误处理Hook
└── lib/auth/
    ├── authService.ts     # OIDC服务类
    └── constants.ts       # 认证常量
```
