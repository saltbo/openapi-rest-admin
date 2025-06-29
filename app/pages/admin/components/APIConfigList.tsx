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
import { useLoaderData, useActionData, useSubmit, useNavigation } from 'react-router';
import type { APIConfigModel, CreateAPIConfigInput, UpdateAPIConfigInput } from '~/types/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function APIConfigList() {
  const { configs, stats } = useLoaderData() as { configs: APIConfigModel[], stats: any };
  const actionData = useActionData() as { success?: boolean, error?: string, message?: string } | undefined;
  const submit = useSubmit();
  const navigation = useNavigation();

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APIConfigModel | null>(null);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailConfig, setDetailConfig] = useState<APIConfigModel | null>(null);

  const isLoading = navigation.state === 'submitting' || navigation.state === 'loading';

  // 显示操作结果消息
  React.useEffect(() => {
    if (actionData?.success) {
      message.success(actionData.message);
      setModalVisible(false);
      setEditingConfig(null);
      form.resetFields();
      setSelectedRowKeys([]);
    } else if (actionData?.error) {
      message.error(actionData.error);
    }
  }, [actionData]);

  // 处理新增配置
  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑配置
  const handleEdit = (config: APIConfigModel) => {
    setEditingConfig(config);
    // 处理 tags 字段 - 在数据库中可能是 JSON 字符串或 null
    let tagsString = '';
    if (config.tags) {
      try {
        const tagsArray = JSON.parse(config.tags);
        tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
      } catch {
        tagsString = '';
      }
    }
    
    form.setFieldsValue({
      ...config,
      tags: tagsString
    });
    setModalVisible(true);
  };

  // 处理删除配置
  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', id);
    submit(formData, { method: 'post' });
  };

  // 处理状态切换
  const handleToggleStatus = (id: string, enabled: boolean) => {
    const formData = new FormData();
    formData.append('intent', 'toggleStatus');
    formData.append('id', id);
    formData.append('enabled', enabled.toString());
    submit(formData, { method: 'post' });
  };

  // 处理批量状态切换
  const handleBatchToggle = (enabled: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的配置');
      return;
    }

    const formData = new FormData();
    formData.append('intent', 'batchToggle');
    formData.append('ids', selectedRowKeys.join(','));
    formData.append('enabled', enabled.toString());
    submit(formData, { method: 'post' });
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      
      formData.append('intent', editingConfig ? 'update' : 'create');
      formData.append('id', values.id);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('openapiUrl', values.openapiUrl);
      formData.append('enabled', values.enabled?.toString() || 'true');
      formData.append('tags', values.tags || '');
      formData.append('version', values.version || '');

      submit(formData, { method: 'post' });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 查看配置详情
  const handleViewDetail = (config: APIConfigModel) => {
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
      dataIndex: 'openapiUrl',
      key: 'openapiUrl',
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
      render: (enabled: boolean, record: APIConfigModel) => (
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
      render: (tags: string | null) => {
        if (!tags) return null;
        try {
          const tagsArray = JSON.parse(tags);
          return Array.isArray(tagsArray) ? tagsArray.map((tag: string) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          )) : null;
        } catch {
          return null;
        }
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
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: APIConfigModel) => (
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
              value={stats.total}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已启用"
              value={stats.enabled}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已禁用"
              value={stats.disabled}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总标签数"
              value={stats.totalTags}
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
                新增配置
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
        confirmLoading={isLoading}
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
                <a href={detailConfig.openapiUrl} target="_blank" rel="noopener noreferrer">
                  {detailConfig.openapiUrl}
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
                {detailConfig.tags ? (() => {
                  try {
                    const tagsArray = JSON.parse(detailConfig.tags);
                    return Array.isArray(tagsArray) && tagsArray.length > 0 ? (
                      tagsArray.map((tag: string) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))
                    ) : '-';
                  } catch {
                    return '-';
                  }
                })() : '-'}
              </Col>

              <Col span={8}><Text strong>创建时间:</Text></Col>
              <Col span={16}>{new Date(detailConfig.createdAt).toLocaleString()}</Col>

              <Col span={8}><Text strong>更新时间:</Text></Col>
              <Col span={16}>{new Date(detailConfig.updatedAt).toLocaleString()}</Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
