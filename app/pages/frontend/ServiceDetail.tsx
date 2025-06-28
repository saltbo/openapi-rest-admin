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
import { apiService } from "../../services/api";
import { 
  getResourceStats, 
  getTopLevelResources, 
  getResourceDisplayName 
} from "../../utils/resourceUtils";

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
    queryFn: () => apiService.getAPIConfigs().then((res) => res.data),
  });

  // 获取当前服务的分析数据
  const { data: serviceAnalysis, isLoading } = useQuery({
    queryKey: ["serviceAnalysis", sName],
    queryFn: () =>
      apiService.getOpenAPIAnalysis(sName!).then((res) => ({
        apiId: sName,
        apiName: apiConfigs.find((c) => c.id === sName)?.name || sName,
        ...res.data,
      })),
    enabled: !!sName && apiConfigs.length > 0,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text>加载服务信息中...</Text>
      </div>
    );
  }

  if (!serviceAnalysis) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text type="secondary">未找到服务信息</Text>
      </div>
    );
  }

  // 使用工具函数计算统计数据
  const resourceStats = serviceAnalysis.resources ? getResourceStats(serviceAnalysis.resources) : {
    totalResources: 0,
    restfulResources: 0,
    totalSubResources: 0,
    topLevelResources: 0
  };
  
  const topLevelResources = serviceAnalysis.resources ? getTopLevelResources(serviceAnalysis.resources) : [];
  
  // HTTP 方法统计
  const httpMethodStats = serviceAnalysis.resources?.reduce(
    (acc, resource: any) => {
      resource.endpoints?.forEach((endpoint: any) => {
        const method = endpoint.method?.toUpperCase();
        if (method) {
          acc[method] = (acc[method] || 0) + 1;
        }
      });
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const stats = {
    totalResources: resourceStats.totalResources,
    topLevelResources: resourceStats.topLevelResources,
    nestedResources: resourceStats.totalSubResources,
    restfulResources: resourceStats.restfulResources,
    totalEndpoints: serviceAnalysis.resources?.reduce(
      (sum: number, r: any) => sum + (r.endpoints?.length || 0),
      0
    ) || 0,
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
                {serviceAnalysis.apiName}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                服务 ID: {sName}
              </Text>
            </div>
          </div>

          {serviceAnalysis.description && (
            <Descriptions column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="版本">
                <Tag color="blue">{serviceAnalysis.version}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题">
                {serviceAnalysis.title}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                <Paragraph>{serviceAnalysis.description}</Paragraph>
              </Descriptions.Item>
              {serviceAnalysis.servers && serviceAnalysis.servers.length > 0 && (
                <Descriptions.Item label="服务器" span={2}>
                  <Space direction="vertical" size="small">
                    {serviceAnalysis.servers.map(
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
                value={stats.totalResources}
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
                value={stats.topLevelResources}
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
              <Statistic
                title="嵌套资源"
                value={stats.nestedResources}
                prefix={<BugOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: "#722ed1", fontWeight: '600' }}
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
                title="RESTful 资源"
                value={stats.restfulResources}
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
                value={stats.totalEndpoints}
                prefix={<ApiOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="GET"
                value={stats.getEndpoints}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="POST"
                value={stats.postEndpoints}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="PUT"
                value={stats.putEndpoints}
                valueStyle={{ color: "#faad14" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="DELETE"
                value={stats.deleteEndpoints}
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
                    {resource.endpoints?.length || 0} 个接口
                  </Text>,
                  resource.is_restful && (
                    <Tag key="restful" color="green">RESTful</Tag>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<DatabaseOutlined style={{ color: "#1890ff" }} />}
                  title={
                    <Space>
                      <Text strong>{getResourceDisplayName(resource)}</Text>
                      {resource.description && (
                        <Text type="secondary">- {resource.description}</Text>
                      )}
                    </Space>
                  }
                  description={
                    <Space wrap>
                      <Text>路径: {resource.basePath || "/"}</Text>
                      {resource.methods && (
                        <Text type="secondary">
                          方法: {resource.methods.join(', ')}
                        </Text>
                      )}
                      {serviceAnalysis.resources?.filter(
                        (r: any) => r.parent_resource === resource.name
                      ).length > 0 && (
                        <Tag color="purple">
                          {
                            serviceAnalysis.resources?.filter(
                              (r: any) => r.parent_resource === resource.name
                            ).length
                          }{" "}
                          个子资源
                        </Tag>
                      )}
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
                版本: {serviceAnalysis.version} | 总路径:{" "}
                {serviceAnalysis.total_paths} | 总操作:{" "}
                {serviceAnalysis.total_operations}
              </Text>
            </Timeline.Item>

            <Timeline.Item color="blue" dot={<InfoCircleOutlined />}>
              <Text strong>RESTful 接口</Text>
              <br />
              <Text type="secondary">
                已识别 {serviceAnalysis.restful_apis} 个 RESTful 风格的接口
              </Text>
            </Timeline.Item>

            <Timeline.Item color="purple" dot={<ApiOutlined />}>
              <Text strong>标签分类</Text>
              <br />
              <Space wrap>
                {serviceAnalysis.tags?.map((tag: string) => (
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
                {serviceAnalysis.last_parsed
                  ? formatDateTime(serviceAnalysis.last_parsed)
                  : "未知"}
              </Text>
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>
    </div>
  );
}
