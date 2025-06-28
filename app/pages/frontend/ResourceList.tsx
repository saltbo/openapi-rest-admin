import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Input, 
  message,
  Tag,
  Modal,
  Alert
} from 'antd';
import { useParams, Link } from 'react-router';
import { 
  DatabaseOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { JsonViewer } from '../../components/JsonViewer';
import type { ResourceDataItem, FieldDefinition } from '../../types/api';

const { Title, Paragraph } = Typography;
const { Search } = Input;

interface ResourceListProps {
  apiId?: string;
  resourceId?: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({ apiId, resourceId }) => {
  const params = useParams<{ sName: string; rName: string }>();
  const queryClient = useQueryClient();
  
  // 优先使用 props，如果没有则使用路由参数
  const sName = apiId || params.sName;
  const rName = resourceId || params.rName;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取 API 配置
  const { data: apiConfig } = useQuery({
    queryKey: ['apiConfig', sName],
    queryFn: () => apiService.getAPIConfig(sName!).then(res => res.data),
    enabled: !!sName,
  });

  // 获取 API 分析结果
  const { data: analysis } = useQuery({
    queryKey: ['openApiAnalysis', sName],
    queryFn: () => apiService.getOpenAPIAnalysis(sName!).then(res => res.data),
    enabled: !!sName,
  });

  // 获取资源定义
  const resource = analysis?.resources.find(r => r.id === rName);

  // 获取资源数据
  const { 
    data: resourceData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['resourceData', sName, rName, currentPage, pageSize, searchQuery],
    queryFn: () => {
      if (searchQuery) {
        return apiService.searchResourceData(sName!, rName!, searchQuery, currentPage, pageSize);
      }
      return apiService.getResourceData(sName!, rName!, currentPage, pageSize);
    },
    enabled: !!sName && !!rName,
  });

  // 删除资源项
  const deleteMutation = useMutation({
    mutationFn: (itemId: string | number) => 
      apiService.deleteResourceItem(sName!, rName!, itemId),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['resourceData', sName, rName] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // 处理删除
  const handleDelete = (item: ResourceDataItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这个 ${resource?.displayName} 吗？`,
      onOk: () => deleteMutation.mutate(item.id),
    });
  };

  // 生成表格列
  const generateColumns = (fields: FieldDefinition[]) => {
    const columns = fields.slice(0, 6).map(field => ({
      title: field.name,
      dataIndex: field.name,
      key: field.name,
      ellipsis: true,
      render: (value: any) => {
        if (value === null || value === undefined) return '-';
        
        switch (field.type) {
          case 'boolean':
            return <Tag color={value ? 'green' : 'red'}>{value ? '是' : '否'}</Tag>;
          case 'date':
          case 'datetime':
            return new Date(value).toLocaleDateString();
          case 'array':
            return Array.isArray(value) ? `${value.length} 项` : '-';
          case 'object':
            return typeof value === 'object' ? 'Object' : '-';
          default:
            return String(value).length > 50 
              ? String(value).substring(0, 50) + '...' 
              : String(value);
        }
      },
    }));

    // 添加操作列
    columns.push({
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ResourceDataItem) => (
        <Space size="small">
          <Link to={`/services/${sName}/resources/${rName}/${record.id}`}>
            <Button 
              type="link" 
              size="small"
              icon={<EyeOutlined />}
            >
              详情
            </Button>
          </Link>
          <Link to={`/services/${sName}/resources/${rName}/${record.id}`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Button 
            type="link" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            loading={deleteMutation.isPending}
          >
            删除
          </Button>
        </Space>
      ),
    } as any);

    return columns;
  };

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="加载失败"
          description={`无法加载资源数据: ${error.message}`}
          type="error"
          action={
            <Button size="small" onClick={() => refetch()}>
              重试
            </Button>
          }
          showIcon
        />
      </div>
    );
  }

  if (!resource) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="资源不存在"
          description={`找不到资源 "${rName}"`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const columns = generateColumns(resource.schema);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space align="start">
          <DatabaseOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {resource.displayName}
            </Title>
            <Paragraph type="secondary">
              {apiConfig?.name} - {resource.path}
            </Paragraph>
          </div>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="搜索数据..."
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Button icon={<FilterOutlined />}>
              筛选
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
          </Space>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              添加新项
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={resourceData?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: resourceData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default ResourceList;
