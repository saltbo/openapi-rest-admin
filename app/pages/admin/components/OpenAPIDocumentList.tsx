import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Statistic,
  Row,
  Col,
  Checkbox,
  Tooltip,
  Typography,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openAPIDocumentClient } from '~/lib/client';
import type { OpenAPIDocument, CreateOpenAPIDocumentInput, UpdateOpenAPIDocumentInput } from '~/types/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function OpenAPIDocumentList() {
  const queryClient = useQueryClient();
  
  // 使用 React Query 获取数据
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['admin-configs'],
    queryFn: () => openAPIDocumentClient.getConfigs(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => openAPIDocumentClient.getStats(),
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<OpenAPIDocument | null>(null);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailConfig, setDetailConfig] = useState<OpenAPIDocument | null>(null);

  const isLoading = configsLoading || statsLoading;

  // 为 stats 提供默认值
  const safeStats = stats || {
    total: 0,
    enabled: 0,
    disabled: 0
  };

  // 创建配置的 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateOpenAPIDocumentInput) => openAPIDocumentClient.createConfig(data),
    onSuccess: () => {
      message.success('OpenAPI 文档配置创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs', 'admin-stats'] });
      setModalVisible(false);
      setEditingConfig(null);
      form.resetFields();
      setSelectedRowKeys([]);
    },
    onError: (error: Error) => {
      message.error(error.message || '创建失败');
    },
  });

  // 更新配置的 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOpenAPIDocumentInput }) => 
      openAPIDocumentClient.updateConfig(id, data),
    onSuccess: () => {
      message.success('OpenAPI 文档配置更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs', 'admin-stats'] });
      setModalVisible(false);
      setEditingConfig(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || '更新失败');
    },
  });

  // 删除配置的 mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => openAPIDocumentClient.deleteConfig(id),
    onSuccess: () => {
      message.success('OpenAPI 文档配置删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs', 'admin-stats'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '删除失败');
    },
  });

  // 批量更新状态的 mutation
  const batchUpdateMutation = useMutation<
    { updatedCount: number }, 
    Error, 
    { ids: string[]; enabled: boolean }
  >({
    mutationFn: ({ ids, enabled }) => 
      openAPIDocumentClient.batchUpdateStatus(ids, enabled),
    onSuccess: (result, { enabled }) => {
      message.success(`成功${enabled ? '启用' : '禁用'} ${result.updatedCount} 个配置`);
      queryClient.invalidateQueries({ queryKey: ['admin-configs', 'admin-stats'] });
      setSelectedRowKeys([]);
    },
    onError: (error: Error) => {
      message.error(error.message || '批量操作失败');
    },
  });

  // 处理新增配置
  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑配置
  const handleEdit = (config: OpenAPIDocument) => {
    setEditingConfig(config);
    // 处理 tags 字段 - 在 OpenAPIDocument 中是字符串数组
    const tagsString = config.tags ? config.tags.join(', ') : '';
    
    form.setFieldsValue({
      ...config,
      openapiUrl: config.openapi_url, // 字段名转换
      tags: tagsString
    });
    setModalVisible(true);
  };

  // 处理删除配置
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // 处理状态切换
  const handleToggleStatus = (id: string, enabled: boolean) => {
    updateMutation.mutate({ id, data: { enabled } });
  };

  // 处理批量状态切换
  const handleBatchToggle = (enabled: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的配置');
      return;
    }

    batchUpdateMutation.mutate({ ids: selectedRowKeys, enabled });
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        id: values.id,
        name: values.name,
        description: values.description || '',
        openapiUrl: values.openapiUrl,
        enabled: values.enabled ?? true,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        version: values.version || undefined
      };

      if (editingConfig) {
        updateMutation.mutate({ id: editingConfig.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 查看配置详情
  const handleViewDetail = (config: OpenAPIDocument) => {
    setDetailConfig(config);
    setDetailModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'OpenAPI URL',
      dataIndex: 'openapi_url',
      key: 'openapi_url',
      width: 200,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: OpenAPIDocument) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          loading={isLoading}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[] | undefined) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
        return tags.map((tag: string) => (
          <Tag key={tag} color="blue">
            {tag}
          </Tag>
        ));
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: OpenAPIDocument) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这个 API 配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总配置数"
              value={safeStats.total}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已启用"
              value={safeStats.enabled}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已禁用"
              value={safeStats.disabled}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="API 类型"
              value="REST"
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                loading={isLoading}
              >
                新增文档
              </Button>
              <Button
                onClick={() => handleBatchToggle(true)}
                disabled={selectedRowKeys.length === 0}
                loading={isLoading}
              >
                批量启用
              </Button>
              <Button
                onClick={() => handleBatchToggle(false)}
                disabled={selectedRowKeys.length === 0}
                loading={isLoading}
              >
                批量禁用
              </Button>
            </Space>
          </Col>
          <Col>
            {selectedRowKeys.length > 0 && (
              <Text type="secondary">
                已选择 {selectedRowKeys.length} 项
              </Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* 配置列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 新增/编辑配置弹窗 */}
      <Modal
        title={editingConfig ? '编辑 API 配置' : '新增 API 配置'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingConfig(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enabled: true }}
        >
          <Form.Item
            name="id"
            label="ID"
            rules={[
              { required: true, message: '请输入 API ID' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线和横线' }
            ]}
          >
            <Input 
              placeholder="如：petstore-api"
              disabled={!!editingConfig}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入 API 名称' }]}
          >
            <Input placeholder="如：Pet Store API" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea 
              placeholder="API 的详细描述..."
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="openapiUrl"
            label="OpenAPI URL"
            rules={[
              { required: true, message: '请输入 OpenAPI URL' },
              { type: 'url', message: '请输入有效的 URL' }
            ]}
          >
            <Input placeholder="https://petstore.swagger.io/v2/swagger.json" />
          </Form.Item>

          <Form.Item
            name="version"
            label="版本"
          >
            <Input placeholder="如：v1.0.0" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
            help="多个标签用逗号分隔"
          >
            <Input placeholder="如：pets, store, user" />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置详情弹窗 */}
      <Modal
        title="API 配置详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setDetailConfig(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              if (detailConfig) {
                handleEdit(detailConfig);
              }
            }}
          >
            编辑
          </Button>,
        ]}
        width={700}
      >
        {detailConfig && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}><Text strong>ID:</Text></Col>
              <Col span={16}><Text code>{detailConfig.id}</Text></Col>

              <Col span={8}><Text strong>名称:</Text></Col>
              <Col span={16}>{detailConfig.name}</Col>

              <Col span={8}><Text strong>描述:</Text></Col>
              <Col span={16}>{detailConfig.description || '-'}</Col>

              <Col span={8}><Text strong>OpenAPI URL:</Text></Col>
              <Col span={16}>
                <a href={detailConfig.openapi_url} target="_blank" rel="noopener noreferrer">
                  {detailConfig.openapi_url}
                </a>
              </Col>

              <Col span={8}><Text strong>状态:</Text></Col>
              <Col span={16}>
                <Tag color={detailConfig.enabled ? 'green' : 'red'}>
                  {detailConfig.enabled ? '已启用' : '已禁用'}
                </Tag>
              </Col>

              <Col span={8}><Text strong>版本:</Text></Col>
              <Col span={16}>{detailConfig.version || '-'}</Col>

              <Col span={8}><Text strong>标签:</Text></Col>
              <Col span={16}>
                {detailConfig.tags && Array.isArray(detailConfig.tags) && detailConfig.tags.length > 0 ? (
                  detailConfig.tags.map((tag: string) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))
                ) : '-'}
              </Col>

              <Col span={8}><Text strong>创建时间:</Text></Col>
              <Col span={16}>{new Date(detailConfig.created_at).toLocaleString()}</Col>

              <Col span={8}><Text strong>更新时间:</Text></Col>
              <Col span={16}>{new Date(detailConfig.updated_at).toLocaleString()}</Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
