import React from 'react';
import { Button, Card, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../components/auth/AuthContext';

const { Title, Paragraph } = Typography;

/**
 * 登录页面
 */
export default function Login() {
  const { login, isAuthenticated } = useAuth();

  const handleLogin = () => {
    login();
  };

  // 如果已登录，显示已登录信息
  if (isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Title level={2}>Already logged in</Title>
          <Paragraph>You are already authenticated.</Paragraph>
          <Button type="primary" onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>Login</Title>
        <Paragraph>
          Please log in to access protected resources.
        </Paragraph>
        <Button 
          type="primary" 
          icon={<LoginOutlined />} 
          size="large" 
          onClick={handleLogin}
          style={{ marginTop: 16 }}
        >
          Login with OIDC
        </Button>
      </Card>
    </div>
  );
}
