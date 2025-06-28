import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Card,
  Tag,
  Modal,
  Descriptions,
  Alert
} from 'antd';
import { Link } from 'react-router';
import { 
  EyeOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import type { APIConfig } from '../../types/api';

const { Title, Paragraph } = Typography;

export const APIConfigList: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<APIConfig | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const { data: apiConfigs = [], isLoading } = useQuery({
    queryKey: ['apiConfigs'],
    queryFn: () => apiService.getAPIConfigs().then(res => res.data),
  });

  const handleViewDetail = (config: APIConfig) => {
    setSelectedConfig(config);
    setIsDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'API 名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: APIConfig) => (
        <Space>
          <ApiOutlined style={{ color: '#1890ff' }} />
          <Link to={`/admin/apis/${record.id}`}>
            <strong>{text}</strong>
          </Link>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, tooltip: text }} style={{ margin: 0 }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: 'OpenAPI URL',
      dataIndex: 'openapi_url',
      key: 'openapi_url',
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
          {url}
        </a>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => version && <Tag color="blue">{version}</Tag>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map(tag => (
            <Tag key={tag} color="default">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag 
          icon={enabled ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={enabled ? 'success' : 'default'}
        >
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: APIConfig) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Link to={`/admin/apis/${record.id}`}>
            <Button type="primary" size="small">
              管理
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>API 配置管理</Title>
        <Paragraph>
          管理您的 OpenAPI 文档配置。这些配置决定了哪些 API 将被解析并生成管理界面。
        </Paragraph>
        
        <Alert
          message="纯前端架构"
          description="当前配置来自代码中的配置文件 (config/apis.ts)。要添加新的 API，请编辑该配置文件。"
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
          showIcon
        />
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={apiConfigs}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: apiConfigs.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="API 配置详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedConfig && (
            <Link key="manage" to={`/admin/apis/${selectedConfig.id}`}>
              <Button type="primary">
                进入管理
              </Button>
            </Link>
          ),
        ]}
        width={800}
      >
        {selectedConfig && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="API 名称">
              {selectedConfig.name}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {selectedConfig.description}
            </Descriptions.Item>
            <Descriptions.Item label="OpenAPI URL">
              <a href={selectedConfig.openapi_url} target="_blank" rel="noopener noreferrer">
                {selectedConfig.openapi_url}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="版本">
              {selectedConfig.version || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag 
                icon={selectedConfig.enabled ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                color={selectedConfig.enabled ? 'success' : 'default'}
              >
                {selectedConfig.enabled ? '已启用' : '已禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="标签">
              <Space wrap>
                {selectedConfig.tags?.map(tag => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default APIConfigList;
