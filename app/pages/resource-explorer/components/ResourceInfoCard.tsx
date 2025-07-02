import React from 'react';
import { Card, Typography, Tooltip, Tag, Button, Space, Drawer } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useResourceDialogs } from '~/pages/resource-explorer/hooks/useResourceDialogs';
import { ResourceActionForm } from '~/pages/resource-explorer/components/ResourceActionForm';
import { ResourceDeleteConfirm } from '~/pages/resource-explorer/components/ResourceDeleteConfirm';
import { Descriptions } from '~/components/json-schema-ui/themes/antd';
import type { OpenAPIService, ResourceInfo } from '~/lib/core';

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

  // 获取资源的 schema
  const resourceSchema = service.getParser().getResourceSchema(resource.name);
  if (!resourceSchema) {
    return <Text type="danger">无法获取资源 {resource.name} 的 schema</Text>;
  }
  console.log(resourceSchema, resourceData);
  

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
            schema={resourceSchema as any}
            data={resourceData}
            column={3}
          />
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
};
