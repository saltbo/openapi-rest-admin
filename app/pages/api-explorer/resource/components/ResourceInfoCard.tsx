import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Tooltip, Tag, Button, Space, Drawer, Spin, Alert } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useResourceDialogs } from '~/pages/api-explorer/resource/hooks/useResourceDialogs';
import { ResourceActionForm } from '~/pages/api-explorer/resource/components/ResourceActionForm';
import { ResourceDeleteConfirm } from '~/pages/api-explorer/resource/components/ResourceDeleteConfirm';
import { useOpenAPIService, useResourceInfo } from '~/hooks/useOpenAPIService';
import { parseResourcePath } from '~/utils/resourceRouting';
import type { ResourceInfo } from '~/lib/api';

const { Text } = Typography;

interface ResourceInfoCardProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  apiId?: string;
  onDeleteSuccess?: () => void;
  onDataLoaded?: (data: any) => void;
}

export const ResourceInfoCard: React.FC<ResourceInfoCardProps> = ({ 
  serviceName, 
  resourceName, 
  itemId, 
  nestedPath, 
  apiId, 
  onDeleteSuccess,
  onDataLoaded
}) => {
  const [loading, setLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [currentResource, setCurrentResource] = useState<ResourceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized } = useOpenAPIService(serviceName);

  // 解析资源路径
  const { currentResourceName } = parseResourcePath(nestedPath || '', resourceName || '');

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !itemId) {
        throw new Error('Missing required parameters or service not initialized');
      }

      setCurrentResource(resource);
      
      // 查找 GET 单个资源的操作
      const getByIdOperation = resource.operations.find(op => 
        op.method.toLowerCase() === 'get' && 
        op.path.includes(`/{${resource.identifierField}}`) 
      );
      
      if (!getByIdOperation) {
        throw new Error(`No GET by ID operation found for resource ${resource.name}`);
      }

      // 使用新的 API 客户端获取资源详情
      const response = await service.getClient().request(getByIdOperation, {pathParams: { [resource.identifierField]: itemId } });
      setCurrentItem(response.data);
      
      // 通知父组件数据已加载
      if (onDataLoaded) {
        onDataLoaded(response.data);
      }
      
    } catch (error) {
      console.error('Failed to load resource detail:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && itemId) {
      loadData();
    }
  }, [isInitialized, service, resource, itemId]);

  // 使用 useResourceDialogs hook 管理对话框状态 
  const {
    showActionForm,
    currentAction,
    selectedItem,
    showDeleteConfirm,
    itemToDelete,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleDeleteSuccess,
    closeActionForm,
    closeDeleteConfirm,
  } = useResourceDialogs(onDeleteSuccess);

  // 编辑按钮点击处理
  const handleEditClick = () => {
    handleEdit(currentItem);
  };

  // 删除按钮点击处理
  const handleDeleteClick = () => {
    handleDelete(currentItem);
  };

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized || loading) {
    return (
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // 错误状态
  if (error || !currentResource || !currentItem) {
    return (
      <Card style={{ marginBottom: '24px' }}>
        <Alert
          message="数据加载失败"
          description={error || "无法加载资源详情，请检查配置或刷新页面"}
          type="error"
          showIcon
        />
      </Card>
    );
  }
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">-</Text>;
    }
    
    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value, null, 2);
      return (
        <Tooltip title="复杂对象数据，请查看原始数据">
          <Tag 
            color="processing"
            style={{ 
              cursor: 'pointer',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              borderRadius: '8px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
          >
            {JSON.stringify(value).substring(0, 50)}...
          </Tag>
        </Tooltip>
      );
    }
    
    const textStr = String(value);
    if (textStr.length > 100) {
      return (
        <Tooltip title={textStr}>
          <Text 
            style={{ 
              display: 'block',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '100px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {textStr.substring(0, 100)}...
          </Text>
        </Tooltip>
      );
    }
    
    // 特殊字段的格式化
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(textStr);
        if (!isNaN(date.getTime())) {
          return (
            <Tooltip title={`原始值: ${textStr}`}>
              <Text>{date.toLocaleString()}</Text>
            </Tooltip>
          );
        }
      } catch (e) {
        // 如果不是有效日期，按普通文本处理
      }
    }
    
    if (key.toLowerCase().includes('email')) {
      return <Text copyable>{textStr}</Text>;
    }
    
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      return (
        <a href={textStr} target="_blank" rel="noopener noreferrer">
          {textStr}
        </a>
      );
    }
    
    return <Text copyable={textStr.length > 20}>{textStr}</Text>;
  };

  const generateDescriptions = () => {
    return Object.entries(currentItem).map(([key, value]) => (
      <Descriptions.Item 
        label={
          <Text strong>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          </Text>
        } 
        key={key}
      >
        {formatValue(key, value)}
      </Descriptions.Item>
    ));
  };

  return (
    <>
      <Card 
        title={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center', 
            padding: '8px 0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
              <Text style={{ fontSize: '18px', fontWeight: '600', color: '#262626' }}>
                基本信息
              </Text>
            </div>
            <Space>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={handleEditClick}
                style={{ 
                  color: '#1890ff',
                  border: 'none'
                }}
              >
                编辑
              </Button>
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleDeleteClick}
                style={{ 
                  border: 'none'
                }}
              >
                删除
              </Button>
            </Space>
          </div>
        }
        bordered={false}
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
          background: '#fff'
        }}
        headStyle={{
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 24px'
        }}
        bodyStyle={{
          padding: '24px'
        }}
    >
      <Descriptions 
        bordered 
        size="middle" 
        column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
        labelStyle={{ 
          backgroundColor: '#fafafa',
          fontWeight: 600,
          width: '140px',
          color: '#262626',
          borderRight: '1px solid #e8e8e8'
        }}
        contentStyle={{
          backgroundColor: '#fff',
          padding: '12px 16px'
        }}
        style={{
          background: '#fff'
        }}
      >
        {generateDescriptions()}
      </Descriptions>
    </Card>

    {/* 编辑表单抽屉 */}
    <Drawer
      title={`编辑资源`}
      placement="right"
      open={showActionForm}
      onClose={closeActionForm}
      width={600}
      destroyOnClose
    >
      {selectedItem && apiId && resource && (
        <ResourceActionForm
          apiId={apiId}
          resource={resource}
          action={currentAction}
          initialData={selectedItem}
          onSuccess={handleFormSuccess}
          onCancel={closeActionForm}
        />
      )}
    </Drawer>

    {/* 删除确认对话框 */}
    {apiId && resource && itemToDelete && (
      <ResourceDeleteConfirm
        apiId={apiId}
        resource={resource}
        item={itemToDelete}
        open={showDeleteConfirm}
        onSuccess={() => {
          handleDeleteSuccess();
          onDeleteSuccess?.();
        }}
        onCancel={closeDeleteConfirm}
      />
    )}
  </>
  );
};
