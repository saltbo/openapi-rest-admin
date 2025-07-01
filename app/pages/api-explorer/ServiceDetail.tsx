import React from "react";
import { useParams, Link } from "react-router";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Space,
  Descriptions,
  Timeline,
  List,
  Button,
} from "antd";
import {
  ApiOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BugOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { openAPIDocumentClient } from '~/lib/client';
import { createOpenAPIService } from '~/lib/api';

const { Title, Text, Paragraph } = Typography;

// 格式化日期时间的工具函数
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export default function ServiceDetail() {
  const { sName } = useParams();

  // 获取所有 API 配置
  const { data: apiConfigs = [] } = useQuery({
    queryKey: ["apiConfigs"],
    queryFn: () => openAPIDocumentClient.getConfigs({ enabled: true }),
  });

  // 获取当前服务的 OpenAPI 服务实例和分析数据
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ["serviceData", sName],
    queryFn: async () => {
      if (!sName || apiConfigs.length === 0) return null;
      
      // 获取 API 配置
      const config = apiConfigs.find((c: any) => c.id === sName);
      if (!config) return null;
      
      // 创建 OpenAPI 服务
      const openAPIService = createOpenAPIService(config.openapi_url);
      await openAPIService.initialize(config.openapi_url);
      
      // 获取所有数据
      const docInfo = openAPIService.getDocumentInfo();
      const stats = openAPIService.getResourceStatistics();
      const topLevelResources = openAPIService.getTopLevelResources();
      
      return {
        apiId: sName,
        apiName: config.name || sName,
        docInfo,
        stats,
        topLevelResources
      };
    },
    enabled: !!sName && apiConfigs.length > 0,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text>加载服务信息中...</Text>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text type="secondary">未找到服务信息</Text>
      </div>
    );
  }

  // 解构数据
  const { apiName, docInfo, stats, topLevelResources } = serviceData;

  // HTTP 方法统计
  const httpMethodStats = stats.methodCounts;

  // 计算总接口数
  const totalEndpoints = stats.totalOperations;

  const displayStats = {
    totalResources: stats.totalResources,
    topLevelResources: topLevelResources.length,
    restfulResources: stats.restfulResources,
    totalEndpoints: totalEndpoints,
    getEndpoints: httpMethodStats.GET || 0,
    postEndpoints: httpMethodStats.POST || 0,
    putEndpoints: httpMethodStats.PUT || 0,
    deleteEndpoints: httpMethodStats.DELETE || 0,
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* 返回按钮 */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/">
            <Button 
              type="text" 
              style={{ 
                color: '#666',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              ← 返回首页
            </Button>
          </Link>
        </div>

        {/* 服务头部信息 */}
        <Card style={{ 
          marginBottom: 24,
          borderRadius: '16px',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
            }}>
              <ApiOutlined style={{ fontSize: 28, color: 'white' }} />
            </div>
            <div>
              <Title level={2} style={{ 
                margin: 0,
                color: '#1a1a1a',
                fontWeight: '600'
              }}>
                {apiName}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                服务 ID: {sName}
              </Text>
            </div>
          </div>

          {docInfo?.description && (
            <Descriptions column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="版本">
                <Tag color="blue">{docInfo.version}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题">
                {docInfo.title}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                <Paragraph>{docInfo.description}</Paragraph>
              </Descriptions.Item>
              {docInfo.servers && docInfo.servers.length > 0 && (
                <Descriptions.Item label="服务器" span={2}>
                  <Space direction="vertical" size="small">
                    {docInfo.servers.map(
                      (serverUrl: string, index: number) => (
                        <div key={index}>
                          <Tag color="green">{serverUrl}</Tag>
                        </div>
                      )
                    )}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Card>

        {/* 统计数据 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.9)'
            }}>
              <Statistic
                title="总资源数"
                value={displayStats.totalResources}
                prefix={<DatabaseOutlined style={{ color: '#3f8600' }} />}
                valueStyle={{ color: "#3f8600", fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.9)'
            }}>
              <Statistic
                title="顶级资源"
                value={displayStats.topLevelResources}
                prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: "#1890ff", fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.9)'
            }}>
              {/* <Statistic
                title="嵌套资源"
                value={displayStats.nestedResources}
                prefix={<BugOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: "#722ed1", fontWeight: '600' }}
              /> */}
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.9)'
            }}>
              <Statistic
                title="RESTful 资源"
                value={displayStats.restfulResources}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: "#52c41a", fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* HTTP 方法统计 */}
        <Card 
          title="接口端点统计" 
          style={{ 
            marginBottom: 24,
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Row gutter={16}>
            <Col span={5}>
              <Statistic
                title="总接口数"
                value={displayStats.totalEndpoints}
                prefix={<ApiOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="GET"
                value={displayStats.getEndpoints}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="POST"
                value={displayStats.postEndpoints}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="PUT"
                value={displayStats.putEndpoints}
                valueStyle={{ color: "#faad14" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="DELETE"
                value={displayStats.deleteEndpoints}
                valueStyle={{ color: "#f5222d" }}
              />
            </Col>
          </Row>
        </Card>

        {/* 资源概览 */}
        <Card 
          title="资源概览" 
          extra={
            <Text type="secondary">
              共 {topLevelResources.length} 个顶级资源
            </Text>
          }
          style={{ 
            marginBottom: 24,
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <List
            dataSource={topLevelResources}
            renderItem={(resource: any) => (
              <List.Item
                actions={[
                  <Link 
                    key="view" 
                    to={`/services/${sName}/resources/${resource.name}`}
                  >
                    <Button type="link" size="small" icon={<EyeOutlined />}>
                      查看资源
                    </Button>
                  </Link>,
                  <Text key="endpoints" type="secondary">
                    {resource.operations ? resource.operations.length : 0} 个接口
                  </Text>,
                  resource.isRESTful && (
                    <Tag key="restful" color="green">RESTful</Tag>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<DatabaseOutlined style={{ color: "#1890ff" }} />}
                  title={
                    <Space>
                      <Text strong>{resource.name}</Text>
                      {resource.operations?.[0]?.description && (
                        <Text type="secondary">- {resource.operations[0].description}</Text>
                      )}
                    </Space>
                  }
                  description={
                    <Space wrap>
                      <Text>路径: {resource.basePath || "/"}</Text>
                      {resource.operations && (
                        <Text type="secondary">
                          方法: {resource.operations.map((op: any) => op.method).join(', ')}
                        </Text>
                      )}
                      {/* {allResources.filter(
                        (r: any) => resource.subResources.some((sub: any) => sub.name === r.name)
                      ).length > 0 && (
                        <Tag color="purple">
                          {resource.subResources.length} 个子资源
                        </Tag>
                      )} */}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {/* API 规范信息 */}
        <Card 
          title="API 规范信息"
          style={{ 
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Timeline>
            <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
              <Text strong>API 基本信息</Text>
              <br />
              <Text type="secondary">
                版本: {docInfo?.version} | 总路径:{" "}
                {stats.totalPaths} | 总操作:{" "}
                {stats.totalOperations}
              </Text>
            </Timeline.Item>

            <Timeline.Item color="blue" dot={<InfoCircleOutlined />}>
              <Text strong>RESTful 接口</Text>
              <br />
              <Text type="secondary">
                已识别 {stats.restfulResources} 个 RESTful 风格的接口
              </Text>
            </Timeline.Item>

            <Timeline.Item color="purple" dot={<ApiOutlined />}>
              <Text strong>标签分类</Text>
              <br />
              <Space wrap>
                {Object.keys(stats.tagCounts).map((tag: string) => (
                  <Tag key={tag} color="purple">
                    {tag}
                  </Tag>
                )) || <Text type="secondary">无标签</Text>}
              </Space>
            </Timeline.Item>

            <Timeline.Item color="gray" dot={<ApiOutlined />}>
              <Text strong>资源分析完成</Text>
              <br />
              <Text type="secondary">
                最后解析时间:{" "}
                {formatDateTime(new Date().toISOString())}
              </Text>
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>
    </div>
  );
}
