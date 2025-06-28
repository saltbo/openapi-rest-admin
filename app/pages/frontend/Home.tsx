import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Button, Space, Typography, Divider } from 'antd';
import { ApiOutlined, DatabaseOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { apiService } from '../../services/api';
import type { APIConfig, ResourceSummary } from '../../types/api';

const { Title, Text } = Typography;

interface HomeStats {
  totalAPIs: number;
  totalResources: number;
  totalRecords: number;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HomeStats>({
    totalAPIs: 0,
    totalResources: 0,
    totalRecords: 0
  });
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [recentResources, setRecentResources] = useState<ResourceSummary[]>([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // 获取 API 配置列表
      const configsResponse = await apiService.getAPIConfigs();
      const configs = configsResponse.data;
      setApiConfigs(configs);

      // 计算统计数据
      let totalResources = 0;
      let totalRecords = 0;
      const recentResourcesList: ResourceSummary[] = [];

      // 遍历每个 API 配置，获取资源统计
      for (const config of configs) {
        try {
          const resources = await apiService.getResources(config.id);
          totalResources += resources.length;
          
          // 模拟每个资源的记录数（在真实环境中应该从实际数据源获取）
          const configRecords = resources.reduce((sum, resource) => {
            const mockCount = Math.floor(Math.random() * 1000) + 10;
            return sum + mockCount;
          }, 0);
          totalRecords += configRecords;

          // 添加到最近资源列表（取前几个）
          resources.slice(0, 2).forEach(resource => {
            recentResourcesList.push({
              ...resource,
              apiConfigId: config.id,
              apiConfigName: config.name,
              recordCount: Math.floor(Math.random() * 1000) + 10
            });
          });
        } catch (error) {
          console.warn(`Failed to load resources for API ${config.name}:`, error);
        }
      }

      setStats({
        totalAPIs: configs.length,
        totalResources,
        totalRecords
      });

      // 只显示前6个最近资源
      setRecentResources(recentResourcesList.slice(0, 6));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>OpenAPI Admin</Title>
        <Text type="secondary">统一管理和查看多个 OpenAPI/Swagger 文档的资源数据</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="API 配置数量"
              value={stats.totalAPIs}
              prefix={<ApiOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="资源类型数量"
              value={stats.totalResources}
              prefix={<DatabaseOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总记录数"
              value={stats.totalRecords}
              prefix={<EyeOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* API 配置列表 */}
        <Col span={12}>
          <Card
            title="API 配置"
            extra={
              <Link to="/admin/apis">
                <Button type="link">查看全部</Button>
              </Link>
            }
          >
            <List
              loading={loading}
              dataSource={apiConfigs}
              renderItem={(config) => (
                <List.Item
                  actions={[
                    <Link to={`/admin/api-detail/${config.id}`} key="detail">
                      <Button type="link" size="small">详情</Button>
                    </Link>,
                    <Link to={`/frontend/resource-list/${config.id}`} key="resources">
                      <Button type="link" size="small">资源</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<ApiOutlined />} />}
                    title={config.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{config.description}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {config.openapi_url}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 最近资源 */}
        <Col span={12}>
          <Card title="最近资源">
            <List
              loading={loading}
              dataSource={recentResources}
              renderItem={(resource) => (
                <List.Item
                  actions={[
                    <Link 
                      to={`/frontend/resource-list/${resource.apiConfigId}?resource=${resource.name}`} 
                      key="view"
                    >
                      <Button type="link" size="small">查看</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<DatabaseOutlined />} />}
                    title={resource.displayName || resource.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">来自: {resource.apiConfigName}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          约 {resource.recordCount} 条记录
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速导航 */}
      <Divider />
      <Card title="快速导航" style={{ marginTop: '24px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Link to="/admin/apis">
              <Card hoverable size="small" style={{ textAlign: 'center' }}>
                <ApiOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>API 配置管理</div>
              </Card>
            </Link>
          </Col>
          <Col span={6}>
            <Link to="/admin/dashboard">
              <Card hoverable size="small" style={{ textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>数据统计</div>
              </Card>
            </Link>
          </Col>
          <Col span={6}>
            <Link to="/admin/settings">
              <Card hoverable size="small" style={{ textAlign: 'center' }}>
                <EyeOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>系统设置</div>
              </Card>
            </Link>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', opacity: 0.6 }}>
              <ApiOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>更多功能</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}