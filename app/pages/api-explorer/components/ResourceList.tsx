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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { frontendAPIService } from '../services';
import { JsonViewer } from '~/components/shared/JsonViewer';
import { ResourceBreadcrumb } from '~/components/shared/ResourceBreadcrumb';
import { parseResourcePath, buildDetailLink } from '~/utils/resourceRouting';
import { resourceManager } from '~/services';
import { generateTableColumnsFromFields } from '~/utils/tableUtils';
import { useServiceData, useResourceData } from '~/hooks/useAPIData';
import type { ResourceDataItem, FieldDefinition } from '~/types/api';

const { Title, Paragraph } = Typography;
const { Search } = Input;

interface ResourceListProps {
  apiId?: string;
  resourceId?: string;
  nestedPath?: string; // 用于处理嵌套的子资源列表
}

export const ResourceList: React.FC<ResourceListProps> = ({ apiId, resourceId, nestedPath }) => {
  const params = useParams<{ sName: string; rName: string }>();
  const queryClient = useQueryClient();
  
  // 优先使用 props，如果没有则使用路由参数
  const sName = apiId || params.sName;
  const rName = resourceId || params.rName;
  
  // 使用工具函数解析嵌套路径
  const { 
    currentResourceName, 
    parentContext, 
    resourceHierarchy 
  } = parseResourcePath(nestedPath, rName || '');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // 使用自定义 hooks 获取数据
  const { apiConfig, analysis } = useServiceData(sName);
  
  // 获取资源定义（使用工具函数查找）
  const resource = analysis?.resources ? resourceManager.findByName(analysis.resources, currentResourceName) : null;

  // 获取资源数据（支持嵌套上下文）
  const { 
    data: resourceData, 
    isLoading, 
    error,
    refetch 
  } = useResourceData(sName, currentResourceName, currentPage, pageSize, searchQuery, nestedPath);

  // 删除资源项 - 暂时禁用，应通过后端API实现
  const deleteMutation = useMutation({
    mutationFn: (itemId: string | number) => {
      // TODO: 实现通过后端API删除资源
      return Promise.reject(new Error('Delete operation not implemented for frontend'));
    },
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['resourceData', sName, currentResourceName] });
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

  // 使用工具函数生成详情页面链接
  const generateDetailLink = (itemId: string | number) => {
    return buildDetailLink(sName!, rName!, nestedPath, itemId);
  };

  // 使用工具函数生成表格列配置
  const generateColumns = (fields: FieldDefinition[]) => {
    return generateTableColumnsFromFields({
      fields,
      maxColumns: 6,
      showActions: true,
      actionHandlers: {
        onDetail: (record: ResourceDataItem) => generateDetailLink(record.id),
        onEdit: (record: ResourceDataItem) => generateDetailLink(record.id),
        onDelete: handleDelete,
      }
    });
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
          description={`找不到资源 "${currentResourceName}"`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // 生成表格列 - 优先使用 schema，如果没有则从数据生成
  const generateColumnsFromSchemaOrData = () => {
    if (resource?.schema && resource.schema.length > 0) {
      return generateColumns(resource.schema);
    }
    
    // 备用方案：从实际数据生成列
    if (resourceData?.data && resourceData.data.length > 0) {
      const sampleItem = resourceData.data[0];
      const dynamicFields: FieldDefinition[] = Object.keys(sampleItem).map(key => ({
        name: key,
        type: typeof sampleItem[key] === 'number' ? 'number' : 
              typeof sampleItem[key] === 'boolean' ? 'boolean' :
              Array.isArray(sampleItem[key]) ? 'array' :
              typeof sampleItem[key] === 'object' ? 'object' : 'string',
        required: false,
        description: `${key} 字段`
      }));
      
      return generateColumns(dynamicFields);
    }
    
    // 如果都没有，返回空数组
    return [];
  };

  const columns = generateColumnsFromSchemaOrData();

  return (
    <div style={{ padding: '24px' }}>
      <ResourceBreadcrumb 
        serviceName={sName} 
        topLevelResource={rName} 
        nestedPath={nestedPath}
        style={{ marginBottom: '16px' }}
      />
      
      <div style={{ marginBottom: '24px' }}>
        <Space align="start">
          <DatabaseOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {resource.displayName}
              {parentContext && (
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  子资源
                </Tag>
              )}
            </Title>
            <Paragraph type="secondary">
              {apiConfig?.name} - {resource.path}
              {parentContext && (
                <span style={{ marginLeft: '8px' }}>
                  (属于 {parentContext[parentContext.length - 1]?.resourceName}: {parentContext[parentContext.length - 1]?.itemId})
                </span>
              )}
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
