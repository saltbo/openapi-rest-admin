import React, { useState } from 'react';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Space, 
  Table, 
  Button, 
  Tag, 
  Alert,
  Tabs,
  Spin,
  Empty,
  Collapse,
  message
} from 'antd';
import { useParams, Link } from 'react-router';
import { 
  ApiOutlined, 
  DatabaseOutlined,
  LinkOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfigClient } from '~/lib/client';
import { frontendAPIService } from '~/pages/api-explorer/services';
import { JsonViewer } from '~/components/shared/JsonViewer';
import type { ParsedResource, FieldDefinition } from '~/types/api';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

export const APIDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: apiConfig, isLoading: configLoading } = useQuery({
    queryKey: ['apiConfig', id],
    queryFn: () => apiConfigClient.getConfig(id!),
    enabled: !!id,
  });

  const { 
    data: analysis, 
    isLoading: analysisLoading, 
    error: analysisError,
    refetch: refetchAnalysis 
  } = useQuery({
    queryKey: ['openApiAnalysis', id],
    queryFn: () => frontendAPIService.getOpenAPIAnalysis(id!).then((res: any) => res.data),
    enabled: !!id,
    retry: 2,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      // 清除缓存并重新解析
      frontendAPIService.clearCache(id!);
      await refetchAnalysis();
    },
    onSuccess: () => {
      message.success('API 分析已刷新');
      queryClient.invalidateQueries({ queryKey: ['openApiAnalysis', id] });
    },
    onError: () => {
      message.error('刷新失败');
    },
  });

  const resourceColumns = [
    {
      title: '资源名称',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string, record: ParsedResource) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <Link to={`/services/${id}/resources/${record.id}`}>
            <strong>{text}</strong>
          </Link>
        </Space>
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => <code>{path}</code>,
    },
    {
      title: '支持方法',
      dataIndex: 'methods',
      key: 'methods',
      render: (methods: string[]) => (
        <Space wrap>
          {methods.map(method => (
            <Tag 
              key={method} 
              color={getMethodColor(method)}
            >
              {method}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      render: (type: string) => (
        <Tag color={getResourceTypeColor(type)}>
          {getResourceTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: '字段数量',
      key: 'fieldCount',
      render: (_: any, record: ParsedResource) => record.schema.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ParsedResource) => (
        <Space>
          <Link to={`/services/${id}/resources/${record.id}`}>
            <Button type="primary" size="small" icon={<EyeOutlined />}>
              查看数据
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  const fieldColumns = [
    {
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <code>{name}</code>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => format && <Tag color="cyan">{format}</Tag>,
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>
          {required ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  if (configLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!apiConfig) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="API 配置不存在" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space align="start">
          <ApiOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {apiConfig.name}
            </Title>
            <Paragraph type="secondary">{apiConfig.description}</Paragraph>
          </div>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="概览" key="overview">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="基本信息">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="API 名称">
                  {apiConfig.name}
                </Descriptions.Item>
                <Descriptions.Item label="版本">
                  {apiConfig.version || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="OpenAPI URL" span={2}>
                  <a href={apiConfig.openapi_url} target="_blank" rel="noopener noreferrer">
                    {apiConfig.openapi_url}
                    <LinkOutlined style={{ marginLeft: '4px' }} />
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {apiConfig.description}
                </Descriptions.Item>
                <Descriptions.Item label="标签" span={2}>
                  <Space wrap>
                    {apiConfig.tags?.map((tag: any) => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {analysisError && (
              <Alert
                message="解析错误"
                description={`无法解析 OpenAPI 文档: ${analysisError.message}`}
                type="error"
                action={
                  <Button 
                    size="small" 
                    icon={<ReloadOutlined />}
                    onClick={() => refreshMutation.mutate()}
                    loading={refreshMutation.isPending}
                  >
                    重试
                  </Button>
                }
                showIcon
              />
            )}

            {analysisLoading && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>正在解析 OpenAPI 文档...</div>
                </div>
              </Card>
            )}

            {analysis && (
              <Card 
                title="解析统计" 
                extra={
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => refreshMutation.mutate()}
                    loading={refreshMutation.isPending}
                  >
                    刷新
                  </Button>
                }
              >
                <Descriptions bordered column={3}>
                  <Descriptions.Item label="总路径数">
                    {analysis.total_paths}
                  </Descriptions.Item>
                  <Descriptions.Item label="总操作数">
                    {analysis.total_operations}
                  </Descriptions.Item>
                  <Descriptions.Item label="RESTful API 数">
                    {analysis.restful_apis}
                  </Descriptions.Item>
                  <Descriptions.Item label="资源数量">
                    {analysis.resources.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="服务器数量">
                    {analysis.servers.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后解析时间">
                    {new Date(analysis.last_parsed).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="资源列表" key="resources">
          {analysis ? (
            <Card title={`资源列表 (${analysis.resources.length})`}>
              <Table
                columns={resourceColumns}
                dataSource={analysis.resources}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
                }}
              />
            </Card>
          ) : (
            <Empty description="暂无资源数据" />
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="字段详情" key="fields">
          {analysis ? (
            <div>
              <Collapse>
                {analysis.resources.map((resource: any) => (
                  <Panel 
                    header={
                      <Space>
                        <strong>{resource.displayName}</strong>
                        <Tag color="blue">{resource.schema.length} 字段</Tag>
                      </Space>
                    } 
                    key={resource.id}
                  >
                    <Table
                      columns={fieldColumns}
                      dataSource={resource.schema}
                      rowKey="name"
                      size="small"
                      pagination={false}
                    />
                  </Panel>
                ))}
              </Collapse>
            </div>
          ) : (
            <Empty description="暂无字段数据" />
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="原始数据" key="raw">
          {analysis ? (
            <Card title="解析结果 (JSON)">
              <JsonViewer data={analysis} />
            </Card>
          ) : (
            <Empty description="暂无原始数据" />
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default APIDetail;

// 辅助函数
function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'purple',
    DELETE: 'red',
    OPTIONS: 'default',
    HEAD: 'default',
  };
  return colors[method] || 'default';
}

function getResourceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    full_crud: 'green',
    read_only: 'blue',
    custom: 'orange',
  };
  return colors[type] || 'default';
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    full_crud: '完整CRUD',
    read_only: '只读',
    custom: '自定义',
  };
  return labels[type] || type;
}
