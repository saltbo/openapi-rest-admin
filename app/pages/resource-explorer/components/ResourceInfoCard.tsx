import React from 'react';
import { Card, Typography, Descriptions, Tooltip, Tag, Button, Space, Drawer } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useResourceDialogs } from '~/pages/resource-explorer/hooks/useResourceDialogs';
import { ResourceActionForm } from '~/pages/resource-explorer/components/ResourceActionForm';
import { ResourceDeleteConfirm } from '~/pages/resource-explorer/components/ResourceDeleteConfirm';
import type { OpenAPIService, ResourceInfo } from '~/lib/api';

const { Text } = Typography;

interface ResourceInfoCardProps {
  service: OpenAPIService;
  resource: ResourceInfo;
  resourceData: any;
  onDataChange?: () => void;
}

export const ResourceInfoCard: React.FC<ResourceInfoCardProps> = ({ 
  service,
  resource,
  resourceData,
  onDataChange
}) => {
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
  } = useResourceDialogs();

  // 编辑按钮点击处理
  const handleEditClick = () => {
    handleEdit(resourceData);
  };

  // 删除按钮点击处理
  const handleDeleteClick = () => {
    handleDelete(resourceData);
  };

  // 封装成功处理函数，加入数据刷新
  const handleFormSuccessWithRefresh = () => {
    handleFormSuccess();
    onDataChange?.();
  };

  const handleDeleteSuccessWithRefresh = () => {
    handleDeleteSuccess();
    onDataChange?.();
  };
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
    return Object.entries(resourceData).map(([key, value]) => (
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
      {selectedItem && resource && (
        <ResourceActionForm
          service={service}
          resource={resource}
          action={currentAction}
          initialData={selectedItem}
          onSuccess={handleFormSuccessWithRefresh}
          onCancel={closeActionForm}
        />
      )}
    </Drawer>

    {/* 删除确认对话框 */}
    {resource && itemToDelete && (
      <ResourceDeleteConfirm
        service={service}
        resource={resource}
        item={itemToDelete}
        open={showDeleteConfirm}
        onSuccess={handleDeleteSuccessWithRefresh}
        onCancel={closeDeleteConfirm}
      />
    )}
  </>
  );
};;
