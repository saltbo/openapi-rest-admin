import React from 'react';
import { Card, Typography, Button, Space, Tag, Table, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { generateTableColumnsFromData } from '~/utils/tableUtils';
import { useResourceDialogs } from '~/pages/api-explorer/hooks/useResourceDialogs';
import { ResourceActionForm } from '~/pages/api-explorer/components/ResourceActionForm';
import { ResourceDeleteConfirm } from '~/pages/api-explorer/components/ResourceDeleteConfirm';
import { capitalizeFirst } from '~/components';
import type { ParsedResource } from '~/types/api';
import type { ResourceHierarchy } from '~/utils/resourceRouting';

const { Title, Text } = Typography;

interface ResourceItem {
  id: string | number;
  [key: string]: any;
}

interface SubResourcesListProps {
  subResources: ParsedResource[];
  subResourceData: { [key: string]: ResourceItem[] };
  serviceName: string;
  resourceHierarchy: ResourceHierarchy[];
  onItemClick: (subResourceName: string, record: ResourceItem) => void;
  onCreateNew: (subResourceName: string) => void;
  apiId?: string;
}

export const SubResourcesList: React.FC<SubResourcesListProps> = ({
  subResources,
  subResourceData,
  serviceName,
  resourceHierarchy,
  onItemClick,
  onCreateNew,
  apiId
}) => {
  // 使用 useResourceDialogs hook 管理对话框状态
  const {
    showActionForm,
    currentAction,
    selectedItem,
    showDeleteConfirm,
    itemToDelete,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleDeleteSuccess,
    closeActionForm,
    closeDeleteConfirm,
  } = useResourceDialogs();

  // 当前操作的子资源
  const [currentSubResource, setCurrentSubResource] = React.useState<ParsedResource | null>(null);

  // 处理新增按钮点击
  const handleAddClick = (subResource: ParsedResource) => {
    console.log(`SubResourcesList - Adding ${subResource.name}: schema length = ${subResource.schema?.length || 0}`);
    setCurrentSubResource(subResource);
    handleAdd();
  };

  const generateSubResourceColumns = (subResource: ParsedResource, data: ResourceItem[]) => {
    return generateTableColumnsFromData({
      data,
      maxColumns: 4,
      showActions: true,
      actionHandlers: {
        onDetail: (record: ResourceItem) => {
          onItemClick(subResource.name, record);
          return '';
        },
        onEdit: (record: ResourceItem) => {
          setCurrentSubResource(subResource);
          handleEdit(record);
        },
        onDelete: (record: ResourceItem) => {
          setCurrentSubResource(subResource);
          handleDelete(record);
        }
      }
    });
  };

  if (subResources.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '20px' 
      }}>
        <div style={{
          width: '4px',
          height: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '2px'
        }} />
        <Title level={3} style={{ 
          margin: 0, 
          color: '#262626',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          关联资源
        </Title>
      </div>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {subResources.map((subResource) => {
          const data = subResourceData[subResource.name] || [];
          return (
            <Card 
              key={subResource.name}
              title={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#262626'
                }}>
                  <span>{capitalizeFirst(subResource.name)}</span>
                  <Button 
                    type="primary" 
                    size="middle" 
                    icon={<PlusOutlined />}
                    onClick={() => handleAddClick(subResource)}
                    style={{
                      borderRadius: '8px',
                      fontWeight: '500',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    新增
                  </Button>
                </div>
              }
              bordered={false}
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
                background: '#fff',
                overflow: 'hidden'
              }}
              headStyle={{
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
                padding: '16px 24px'
              }}
              bodyStyle={{
                padding: '0'
              }}
            >
              <div style={{ padding: '0 24px 24px 24px' }}>
                <Table
                  columns={generateSubResourceColumns(subResource, data)}
                  dataSource={data}
                  rowKey="id"
                  size="middle"
                  scroll={{ x: 'max-content' }}
                  pagination={{ 
                    pageSize: 5, 
                    showSizeChanger: false,
                    showQuickJumper: false,
                    size: 'small'
                  }}
                  locale={{
                    emptyText: (
                      <div style={{ 
                        padding: '40px 0',
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        暂无数据
                      </div>
                    )
                  }}
                  style={{
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* 编辑表单抽屉 */}
      <Drawer
        title={`${currentAction === 'create' ? '添加' : '编辑'}${currentSubResource?.name || '资源'}`}
        placement="right"
        open={showActionForm}
        onClose={closeActionForm}
        width={600}
        destroyOnClose
      >
        {apiId && currentSubResource && (currentAction === 'create' || selectedItem) && (
          <ResourceActionForm
            apiId={apiId}
            resource={currentSubResource}
            action={currentAction}
            initialData={currentAction === 'edit' ? selectedItem : undefined}
            onSuccess={handleFormSuccess}
            onCancel={closeActionForm}
          />
        )}
      </Drawer>

      {/* 删除确认对话框 */}
      {apiId && currentSubResource && itemToDelete && (
        <ResourceDeleteConfirm
          apiId={apiId}
          resource={currentSubResource}
          item={itemToDelete}
          open={showDeleteConfirm}
          onSuccess={handleDeleteSuccess}
          onCancel={closeDeleteConfirm}
        />
      )}
    </div>
  );
};

export default SubResourcesList;
