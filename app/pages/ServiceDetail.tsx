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
import { useOpenAPIService } from "~/hooks/useOpenAPIService";
import ResourceLoading from "./resource-explorer/components/ResourceLoading";

const { Title, Text, Paragraph } = Typography;

// 格式化日期时间的工具函数
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function ServiceDetail() {
  const { service, isLoading } = useOpenAPIService();
  const docInfo = service?.getDocumentInfo();
  const stats = service?.getResourceStatistics();
  const topLevelResources = service?.getTopLevelResources();
  if (!stats || !topLevelResources || isLoading) {
    throw <ResourceLoading />;
  }

  const httpMethodStats = stats.methodCounts;
  const displayStats = {
    totalResources: stats.totalResources,
    totalPaths: stats.totalPaths,
    topLevelResources: topLevelResources.length,
    restfulResources: stats.restfulResources,
    totalEndpoints: stats.totalOperations,
    getEndpoints: httpMethodStats.GET || 0,
    postEndpoints: httpMethodStats.POST || 0,
    putEndpoints: httpMethodStats.PUT || 0,
    deleteEndpoints: httpMethodStats.DELETE || 0,
    patchEndpoints: httpMethodStats.PATCH || 0,
    totalTags: Object.keys(stats.tagCounts).length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* 服务头部信息 */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 20,
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
              }}
            >
              <ApiOutlined style={{ fontSize: 28, color: "white" }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                {docInfo?.title || "API 服务"}
              </Title>
              <Space>
                <Tag color="blue">{docInfo?.version || "v1.0"}</Tag>
                <Text type="secondary">
                  {displayStats.totalEndpoints} 个接口 ·{" "}
                  {displayStats.totalResources} 个资源
                </Text>
              </Space>
            </div>
          </div>

          {docInfo && (
            <Descriptions column={2}>
              {docInfo.description && (
                <Descriptions.Item label="描述" span={2}>
                  <Paragraph style={{ marginBottom: 0 }}>
                    {docInfo.description}
                  </Paragraph>
                </Descriptions.Item>
              )}
              {docInfo.servers && docInfo.servers.length > 0 && (
                <Descriptions.Item label="服务器地址" span={2}>
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {docInfo.servers.map((serverUrl: string, index: number) => (
                      <Tag
                        key={index}
                        color="green"
                        style={{ margin: "2px 4px 2px 0" }}
                      >
                        {serverUrl}
                      </Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Card>

        {/* HTTP 方法统计 */}
        <Card
          title="接口端点统计"
          style={{
            marginBottom: 24,
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="总接口数"
                value={displayStats.totalEndpoints}
                prefix={<ApiOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="GET"
                value={displayStats.getEndpoints}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="POST"
                value={displayStats.postEndpoints}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="PUT"
                value={displayStats.putEndpoints}
                valueStyle={{ color: "#faad14" }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="PATCH"
                value={displayStats.patchEndpoints}
                valueStyle={{ color: "#722ed1" }}
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
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <List
            dataSource={topLevelResources}
            renderItem={(resource: any) => (
              <List.Item
                actions={[
                  <Link key="view" to={`/r/${resource.name}`}>
                    <Button type="link" size="small" icon={<EyeOutlined />}>
                      查看资源
                    </Button>
                  </Link>,
                  <Text key="endpoints" type="secondary">
                    {resource.operations ? resource.operations.length : 0}{" "}
                    个接口
                  </Text>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<DatabaseOutlined style={{ color: "#1890ff" }} />}
                  title={
                    <Space>
                      <Text strong>{resource.name}</Text>
                      {resource.operations?.[0]?.description && (
                        <Text type="secondary">
                          - {resource.operations[0].description}
                        </Text>
                      )}
                    </Space>
                  }
                  description={
                    <Space wrap>
                      <Text>路径: {resource.basePath || "/"}</Text>
                      {resource.operations && (
                        <Text type="secondary">
                          方法:
                          {resource.operations
                            .map((op: any) => op.method)
                            .join(", ")}
                        </Text>
                      )}
                      {resource.subResources.length > 0 && (
                        <Tag color="purple">
                          {resource.subResources.length} 个子资源
                        </Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
