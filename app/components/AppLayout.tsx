import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, theme, Button, Space, Spin, Select } from 'antd';
import { Link, useLocation } from 'react-router';
import { 
  HomeOutlined, 
  ApiOutlined, 
  SettingOutlined, 
  DatabaseOutlined,
  DashboardOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [selectedApiId, setSelectedApiId] = useState<string>('multi-clusters-api'); // 默认选择第一个API
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 获取所有 API 配置
  const { data: apiConfigs = [] } = useQuery({
    queryKey: ['apiConfigs'],
    queryFn: () => apiService.getAPIConfigs().then(res => res.data),
  });

  // 获取当前选中 API 的分析数据
  const { data: currentAnalysis, isLoading } = useQuery({
    queryKey: ['currentAnalysis', selectedApiId],
    queryFn: () => apiService.getOpenAPIAnalysis(selectedApiId.toString())
      .then(res => ({ apiId: selectedApiId, apiName: apiConfigs.find(c => c.id === selectedApiId)?.name || '', ...res.data })),
    enabled: !!selectedApiId && apiConfigs.length > 0,
  });

  // 当 API 配置加载完成后，设置默认选中的 API
  useEffect(() => {
    if (apiConfigs.length > 0 && !selectedApiId) {
      setSelectedApiId(apiConfigs[0].id);
    }
  }, [apiConfigs, selectedApiId]);

  const handleApiChange = (apiId: string) => {
    setSelectedApiId(apiId);
  };

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
    if (location.pathname === '/') return '/';
    if (location.pathname.startsWith('/admin/apis')) return '/admin/apis';
    if (location.pathname.startsWith('/admin/settings')) return '/admin/settings';
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/services/')) {
      // 对于服务页面，返回完整的路径作为选中的key
      return location.pathname;
    }
    return location.pathname;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {isAdmin ? '管理后台' : '资源中心'}
          </Title>
        </div>
        
        {/* 菜单区域 */}
        <div style={{ height: 'calc(100% - 73px)', display: 'flex', flexDirection: 'column' }}>
          {/* 首页菜单项 */}
          {!isAdmin && (
            <Menu
              mode="inline"
              selectedKeys={location.pathname === '/' ? ['/'] : []}
              style={{ border: 'none', flexShrink: 0 }}
              items={[{
                key: '/',
                icon: <HomeOutlined />,
                label: <Link to="/">首页</Link>,
              }]}
            />
          )}
          
          {/* API 选择器 */}
          {!isAdmin && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                选择 API 文档
              </div>
              <Select
                value={selectedApiId}
                onChange={handleApiChange}
                style={{ width: '100%' }}
                placeholder="选择 API"
                loading={!apiConfigs.length}
                size="small"
              >
                {apiConfigs.map(config => (
                  <Option key={config.id} value={config.id}>
                    {config.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* 资源菜单 */}
          {!isAdmin && (
            isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', flex: 1 }}>
                <Spin />
                <div style={{ marginTop: '8px' }}>加载资源中...</div>
              </div>
            ) : (
              <Menu
                mode="inline"
                selectedKeys={location.pathname.startsWith('/services/') ? [location.pathname] : []}
                style={{ border: 'none', flex: 1 }}
                items={currentAnalysis?.resources
                  ?.filter((resource: any) => !resource.parent_resource) // 只显示顶级资源
                  ?.map((resource: any) => ({
                    key: `/services/${selectedApiId}/resources/${resource.name}`,
                    icon: <DatabaseOutlined />,
                    label: (
                      <Link to={`/services/${selectedApiId}/resources/${resource.name}`}>
                        {resource.displayName || resource.name}
                      </Link>
                    ),
                  })) || []}
              />
            )
          )}

          {/* 后台菜单 */}
          {isAdmin && (
            <Menu
              mode="inline"
              selectedKeys={[getSelectedKey()]}
              style={{ height: '100%', borderRight: 0, border: 'none' }}
              items={adminMenuItems}
            />
          )}
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
            {isAdmin 
              ? 'OpenAPI Admin - 管理后台' 
              : location.pathname === '/'
                ? 'OpenAPI Admin - 资源中心'
                : currentAnalysis 
                  ? `${currentAnalysis.apiName} - ${currentAnalysis.resources?.find((r: any) => location.pathname.includes(r.name))?.name || '资源管理'}`
                  : 'OpenAPI Admin - 资源中心'
            }
          </Title>
          <Space>
            {isAdmin ? (
              <Link to="/">
                <Button icon={<UserOutlined />}>
                  前台
                </Button>
              </Link>
            ) : (
              <Link to="/admin">
                <Button icon={<SettingOutlined />}>
                  后台管理
                </Button>
              </Link>
            )}
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
