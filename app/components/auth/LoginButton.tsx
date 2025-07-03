import React from "react";
import { Button, Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { UserOutlined, LogoutOutlined, LoginOutlined } from "@ant-design/icons";
import { useAuth } from "./AuthContext";
import { useAuthError } from "../../hooks/useAuthError";

/**
 * 登录状态按钮组件
 */
export function LoginButton() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  
  // 自动显示错误信息
  useAuthError();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      // 错误已经在上下文中处理，这里不需要额外处理
      console.error('Login failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // 加载状态
  if (loading) {
    return <Button loading>Loading...</Button>;
  }

  // 用户已登录
  if (isAuthenticated && user) {
    const items: MenuProps["items"] = [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      },
    ];

    const userName =
      user.profile?.name ||
      user.profile.nickname ||
      user.profile?.email ||
      "User";
    const userAvatar = user.profile?.picture;

    return (
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button type="text" style={{ padding: "4px 8px", height: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Avatar
              size="small"
              src={userAvatar}
              icon={!userAvatar && <UserOutlined />}
            />
            <span>{userName}</span>
          </div>
        </Button>
      </Dropdown>
    );
  }

  // 用户未登录
  return (
    <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin}>
      Login
    </Button>
  );
}
