import React, { useEffect, useState } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { getAuthService } from '../../lib/auth/authService';
import type { User } from 'oidc-client-ts';

/**
 * 登录状态按钮组件
 */
export function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const authService = getAuthService();

  useEffect(() => {
    // 加载当前用户
    const loadUser = async () => {
      if (authService) {
        const currentUser = await authService.loadUser();
        setUser(currentUser);
      }
    };

    loadUser();

    // 添加监听器
    const handleLoginEvent = () => {
      setUser(authService?.getUser() || null);
    };

    const handleLogoutEvent = () => {
      setUser(null);
    };

    if (authService) {
      authService.addEventListener('login', handleLoginEvent);
      authService.addEventListener('logout', handleLogoutEvent);
    }

    // 清理监听器
    return () => {
      if (authService) {
        authService.removeEventListener('login', handleLoginEvent);
        authService.removeEventListener('logout', handleLogoutEvent);
      }
    };
  }, [authService]);

  const handleLogin = () => {
    if (authService) {
      // 保存当前URL作为登录后的返回地址
      localStorage.setItem('returnUrl', window.location.pathname);
      authService.login();
    }
  };

  const handleLogout = () => {
    if (authService) {
      authService.logout();
    }
  };

  if (!authService) {
    return null; // 认证服务未初始化，不显示按钮
  }

  if (user && authService.isAuthenticated()) {
    // 用户已登录
    const items: MenuProps['items'] = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: user.profile?.name || user.profile?.email || 'User Profile'
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout
      }
    ];

    return (
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button type="text" icon={<UserOutlined />}>
          {user.profile?.name || user.profile?.email || 'User'}
        </Button>
      </Dropdown>
    );
  }

  // 用户未登录
  return (
    <Button
      type="primary"
      icon={<LoginOutlined />}
      onClick={handleLogin}
    >
      Login
    </Button>
  );
}
