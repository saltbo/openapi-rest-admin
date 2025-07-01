import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Typography, theme, Button, Space, Spin, Select } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { 
  HomeOutlined, 
  SettingOutlined, 
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { openAPIDocumentClient } from '~/lib/client';
import { createOpenAPIService } from '~/lib/api';
import { capitalizeFirst } from '../shared';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

interface FrontendLayoutProps {
  children: React.ReactNode;
}

export const FrontendLayout: React.FC<FrontendLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedApiId, setSelectedApiId] = useState<string>(''); // 初始为空，等待 API 配置加载后设置
  const [shouldAutoNavigate, setShouldAutoNavigate] = useState<boolean>(true); // 控制是否应该自动导航
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  // 获取所有 API 配置
  const { data: apiConfigs = [] } = useQuery({
    queryKey: ['apiConfigs'],
    queryFn: () => openAPIDocumentClient.getConfigs({ enabled: true }),
  });

  // 根据选中的API创建OpenAPIService实例
  const openAPIService = useMemo(() => {
    if (!selectedApiId || apiConfigs.length === 0) {
      return null;
    }
    
    const selectedConfig = apiConfigs.find((config: any) => config.id === selectedApiId);
    if (!selectedConfig) {
      return null;
    }
    
    // 从OpenAPI文档URL提取基础URL，如果没有则使用默认值
    // 这里我们先创建服务，稍后会初始化它
    return createOpenAPIService('');
  }, [selectedApiId, apiConfigs]);

  // 获取当前选中 API 的分析数据
  const { data: currentAnalysis, isLoading } = useQuery({
    queryKey: ['currentAnalysis', selectedApiId],
    queryFn: async () => {
      if (!openAPIService || !selectedApiId) {
        throw new Error('OpenAPI service not initialized');
      }
      
      const selectedConfig = apiConfigs.find((config: any) => config.id === selectedApiId);
      if (!selectedConfig) {
        throw new Error('API config not found');
      }
      
      // 初始化OpenAPI服务
      await openAPIService.initialize(selectedConfig.openapi_url);
      
      // 获取文档信息和资源统计
      const documentInfo = openAPIService.getDocumentInfo();
      const resourceStats = openAPIService.getResourceStatistics();
      const resources = openAPIService.getTopLevelResources();
      
      return {
        apiId: selectedApiId,
        apiName: selectedConfig.name,
        base_url: documentInfo?.servers?.[0] || '',
        title: documentInfo?.title || selectedConfig.name,
        version: documentInfo?.version || '1.0.0',
        description: documentInfo?.description || '',
        resources,
        resourceStats
      };
    },
    enabled: !!selectedApiId && !!openAPIService, // 只要有选中的 API ID 和服务实例就启用查询
  });

  // 当 API 配置加载完成后，设置默认选中的 API
  useEffect(() => {
    if (apiConfigs.length > 0 && !selectedApiId) {
      setSelectedApiId(apiConfigs[0].id);
    }
  }, [apiConfigs, selectedApiId]);

  // 当切换 API 且需要自动导航时，自动导航到服务详情页
  useEffect(() => {
    if (currentAnalysis && shouldAutoNavigate) {
      // 检查当前路径，如果用户已经在服务相关页面，不要自动跳转
      const currentPath = location.pathname;
      const isOnServicePage = currentPath.startsWith(`/services/${selectedApiId}`);
      
      if (!isOnServicePage) {
        navigate(`/services/${selectedApiId}`);
      }
      setShouldAutoNavigate(false); // 导航后禁用自动导航
    }
  }, [currentAnalysis, selectedApiId, navigate, shouldAutoNavigate, location.pathname]);

  // 监听路径变化，当用户主动导航到首页时，禁用自动导航
  // 当用户直接访问服务页面时，从 URL 中提取 API ID 并设置
  useEffect(() => {
    if (location.pathname === '/') {
      setShouldAutoNavigate(false);
    } else if (location.pathname.startsWith('/services/')) {
      // 从 URL 中提取 API ID
      const pathParts = location.pathname.split('/');
      if (pathParts.length >= 3) {
        const apiIdFromUrl = decodeURIComponent(pathParts[2]);
        // 如果 URL 中的 API ID 与当前选中的不同，更新选中的 API ID
        if (apiIdFromUrl !== selectedApiId && apiConfigs.length > 0) {
          // 验证这个 API ID 是否存在于配置中
          const validApi = apiConfigs.find((api: any) => api.id === apiIdFromUrl);
          if (validApi) {
            setSelectedApiId(apiIdFromUrl);
            setShouldAutoNavigate(false); // 用户直接访问时不要自动跳转
          }
        } else {
          setShouldAutoNavigate(false); // 用户已经在正确的服务页面
        }
      }
    }
  }, [location.pathname, selectedApiId, apiConfigs]);

  const handleApiChange = (apiId: string) => {
    setSelectedApiId(apiId);
    setShouldAutoNavigate(true); // 切换 API 时重新启用自动导航
    // 切换 API 时，如果当前在资源页面，则导航到首页，让用户重新选择资源
    if (location.pathname.startsWith('/services/')) {
      navigate('/');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            资源中心
          </Title>
        </div>
        
        {/* 菜单区域 */}
        <div style={{ height: 'calc(100% - 73px)', display: 'flex', flexDirection: 'column' }}>
          {/* 首页菜单项 */}
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
          
          {/* API 选择器 */}
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
              {apiConfigs.map((config: any) => (
                <Option key={config.id} value={config.id}>
                  {config.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* 资源菜单 */}
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', flex: 1 }}>
              <Spin />
              <div style={{ marginTop: '8px' }}>加载资源中...</div>
            </div>
          ) : currentAnalysis ? (
            <div style={{ flex: 1 }}>
              {/* 资源列表 */}
              <div style={{ padding: '0 16px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>资源列表</div>
              </div>
              <Menu
                mode="inline"
                selectedKeys={location.pathname.startsWith('/services/') && location.pathname.includes('/resources/') ? [location.pathname] : []}
                style={{ border: 'none' }}
                items={currentAnalysis.resources
                  ?.filter((resource: any) => !resource.parent_resource) // 只显示顶级资源
                  ?.map((resource: any) => ({
                    key: `/services/${selectedApiId}/resources/${resource.name}`,
                    icon: <DatabaseOutlined />,
                    label: (
                      <Link to={`/services/${selectedApiId}/resources/${resource.name}`}>
                        {capitalizeFirst(resource.name)}
                      </Link>
                    ),
                  })) || []}
              />
            </div>
          ) : null}
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
            {location.pathname === '/'
              ? 'OpenAPI Admin - 资源中心'
              : currentAnalysis 
                ? `${currentAnalysis.apiName} - ${(() => {
                    const resource = currentAnalysis.resources?.find((r: any) => location.pathname.includes(r.name));
                    return resource ? capitalizeFirst(resource.name) : '资源管理';
                  })()}`
                : 'OpenAPI Admin - 资源中心'
            }
          </Title>
          <Space>
            <Link to="/admin">
              <Button icon={<SettingOutlined />}>
                后台管理
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
