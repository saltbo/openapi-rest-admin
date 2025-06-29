import React from 'react';
import { Layout, Menu, Typography, theme, Button, Space } from 'antd';
import { Link, useLocation } from 'react-router';
import { 
  ApiOutlined, 
  SettingOutlined, 
  DashboardOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 后台导航菜单
  const adminMenuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">仪表盘</Link>,
    },
    {
      key: '/admin/apis',
      icon: <ApiOutlined />,
      label: <Link to="/admin/apis">API 配置</Link>,
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">系统设置</Link>,
    },
  ];
  
  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/admin/apis')) return '/admin/apis';
    if (location.pathname.startsWith('/admin/settings')) return '/admin/settings';
    if (location.pathname.startsWith('/admin')) return '/admin';
    return location.pathname;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            管理后台
          </Title>
        </div>
        
        {/* 菜单区域 */}
        <div style={{ height: 'calc(100% - 73px)', display: 'flex', flexDirection: 'column' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0, border: 'none' }}
            items={adminMenuItems}
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            OpenAPI Admin - 管理后台
          </Title>
          <Space>
            <Link to="/">
              <Button icon={<UserOutlined />}>
                前台
              </Button>
            </Link>
          </Space>
        </Header>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
