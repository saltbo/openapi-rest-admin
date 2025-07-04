import React from "react";
import { Button, Card, Typography, Alert } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useAuth } from "../../components/auth/AuthContext";
import { useAuthError } from "../../hooks/useAuthError";

const { Title, Paragraph } = Typography;

/**
 * 登录页面
 */
export default function Login() {
  const { login, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  
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

  // 如果已登录，显示已登录信息
  if (isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Card style={{ width: 400, textAlign: "center" }}>
          <Title level={2}>Already logged in</Title>
          <Paragraph>You are already authenticated.</Paragraph>
          <Button type="primary" onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: 400, textAlign: "center" }}>
        <Title level={2}>Login</Title>
        <Paragraph>Please log in to access protected resources.</Paragraph>
        
        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        
        <Button
          type="primary"
          icon={<LoginOutlined />}
          size="large"
          loading={loading}
          onClick={handleLogin}
          style={{ marginTop: 16 }}
        >
          Login with OIDC
        </Button>
      </Card>
    </div>
  );
}
