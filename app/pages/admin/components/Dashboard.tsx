import React from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Space, List } from 'antd';
import { Link } from 'react-router';
import { 
  ApiOutlined, 
  DatabaseOutlined, 
  PlusOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { openAPIDocumentClient } from '~/lib/client';
import { frontendAPIService } from '~/pages/api-explorer/services';

const { Title, Paragraph } = Typography;

export const AdminDashboard: React.FC = () => {
  const { data: apiConfigs = [] } = useQuery({
    queryKey: ['apiConfigs'],
    queryFn: () => openAPIDocumentClient.getConfigs({ enabled: true }),
  });

  // 获取所有 API 的分析数据
  const { data: allAnalyses = [] } = useQuery({
    queryKey: ['allAnalyses', apiConfigs.length],
    queryFn: async () => {
      const analyses = await Promise.all(
        apiConfigs.map((config: any) => 
          frontendAPIService.getOpenAPIAnalysis(config.id.toString())
            .then((res: any) => ({ apiId: config.id, apiName: config.name, ...res.data }))
            .catch(() => null)
        )
      );
      return analyses.filter(Boolean);
    },
    enabled: apiConfigs.length > 0,
  });

  const totalAPIs = apiConfigs.length;
  const totalResources = allAnalyses.reduce((acc: number, analysis: any) => 
    acc + (analysis?.resources?.filter((r: any) => r.is_restful)?.length || 0), 0
  );

  // 获取所有资源的列表
  const allResources = allAnalyses.flatMap((analysis: any) => 
    analysis?.resources
      ?.filter((r: any) => r.is_restful)
      ?.map((resource: any) => ({
        ...resource,
        apiId: analysis.apiId,
        apiName: analysis.apiName,
      })) || []
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>OpenAPI 管理后台</Title>
        <Paragraph>
          管理和配置您的 OpenAPI 文档，添加新的 API 配置并查看系统设置。
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total APIs"
              value={totalAPIs}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Resources"
              value={totalResources}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Configs"
              value={totalAPIs}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Quick Actions" 
            extra={<Link to="/admin/apis">View All APIs</Link>}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block
                size="large"
              >
                <Link to="/admin/apis">Manage API Configurations</Link>
              </Button>
              <Paragraph style={{ marginBottom: 0, color: '#666' }}>
                Add or configure your OpenAPI specifications to generate admin interfaces.
              </Paragraph>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="Available Resources" 
            extra={
              <Button type="link" size="small">
                View All <RightOutlined />
              </Button>
            }
          >
            {allResources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <DatabaseOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Paragraph style={{ marginTop: 16, color: '#999' }}>
                  No RESTful resources found. Add API configurations to discover resources.
                </Paragraph>
                <Button type="primary">
                  <Link to="/admin/apis">Configure APIs</Link>
                </Button>
              </div>
            ) : (
              <List
                size="small"
                dataSource={allResources.slice(0, 5)}
                renderItem={(resource: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                      title={
                        <Link to={`/data/${resource.apiId}/${resource.name.toLowerCase()}`}>
                          {resource.name}
                        </Link>
                      }
                      description={`${resource.apiName} - ${resource.methods.join(', ')}`}
                    />
                    <Button 
                      type="link" 
                      size="small"
                      icon={<RightOutlined />}
                    >
                      <Link to={`/data/${resource.apiId}/${resource.name.toLowerCase()}`}>
                        Manage
                      </Link>
                    </Button>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
