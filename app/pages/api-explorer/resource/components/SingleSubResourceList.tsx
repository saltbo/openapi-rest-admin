import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Drawer, Spin, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useResourceDialogs } from '~/pages/api-explorer/resource/hooks/useResourceDialogs';
import { ResourceActionForm } from '~/pages/api-explorer/resource/components/ResourceActionForm';
import { ResourceDeleteConfirm } from '~/pages/api-explorer/resource/components/ResourceDeleteConfirm';
import { useOpenAPIService, useResourceInfo, useResourceTableSchema } from '~/hooks/useOpenAPIService';
import { parseResourcePath } from '~/utils/resourceRouting';
import { capitalizeFirst } from '~/components';
import { Table } from '~/components/json-schema-ui/themes/antd';
import type { ResourceInfo } from '~/lib/api';

const { Title } = Typography;

interface SingleSubResourceListProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  subResource: ResourceInfo;
  apiId?: string;
}

export const SingleSubResourceList: React.FC<SingleSubResourceListProps> = ({
  serviceName,
  resourceName,
  itemId,
  nestedPath,
  subResource,
  apiId
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized } = useOpenAPIService(serviceName);

  // 解析资源路径
  const { currentResourceName } = parseResourcePath(nestedPath || '', resourceName || '');

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);
  const tableSchema = useResourceTableSchema(service, subResource.name);

  // 加载子资源数据
  const loadSubResourceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !itemId || !subResource) {
        setData([]);
        return;
      }

      // 查找子资源的 GET 列表操作
      const getListOperation = subResource.operations.find(op => {
        const isGet = op.method.toLowerCase() === 'get';
        const pathEndsWithId = op.path.endsWith('{id}') || op.path.endsWith(`{${subResource.name}Id}`);
        return isGet && !pathEndsWithId;
      });
      
      if (getListOperation) {
        // 构建路径参数
        const pathParams: Record<string, any> = {};
        
        if (getListOperation.path.includes('{id}')) {
          pathParams['id'] = itemId;
        } else if (getListOperation.path.includes(`{${resource.name}Id}`)) {
          pathParams[`${resource.name}Id`] = itemId;
        } else if (getListOperation.path.includes('{parentId}')) {
          pathParams['parentId'] = itemId;
        }
        
        // 使用新的 API 客户端获取子资源列表
        const subResourceResponse = await service.getClient().getList(getListOperation, {
          pathParams,
          page: 1,
          pageSize: 10
        });
        
        setData(subResourceResponse.data || []);
      } else {
        setData([]);
      }
      
    } catch (error) {
      console.error(`Failed to load sub-resource ${subResource.name}:`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && itemId && subResource) {
      loadSubResourceData();
    }
  }, [isInitialized, service, resource, itemId, subResource]);

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

  // 处理新增按钮点击
  const handleAddClick = () => {
    console.log(`SingleSubResourceList - Adding ${subResource.name}: operations length = ${subResource.operations?.length || 0}`);
    handleAdd();
  };

  const actionHandlers = {
    onDetail: (record: any) => {
      return '';
    },
    onEdit: (record: any) => {
      handleEdit(record);
    },
    onDelete: (record: any) => {
      handleDelete(record);
    }
  };

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized || loading) {
    return (
      <Card
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card
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
          padding: '24px'
        }}
      >
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!tableSchema) {
    return (
        <Card
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
                padding: '24px'
            }}
        >
            <Alert
                message="无法加载表格"
                description={`无法找到资源 "${subResource.name}" 的表格定义。`}
                type="warning"
                showIcon
            />
        </Card>
    );
  }

  return (
    <>
      <Card 
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
              onClick={handleAddClick}
              style={{
                borderRadius: '8px',
                fontWeight: '500',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              创建新{subResource.name}
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
        <Table
          schema={tableSchema}
          data={data}
          loading={loading}
          actionHandlers={actionHandlers}
        />
      </Card>

      {/* 编辑表单抽屉 */}
      <Drawer
        title={`${currentAction === 'create' ? '创建' : '编辑'} ${subResource.name}`}
        placement="right"
        open={showActionForm}
        onClose={closeActionForm}
        width={600}
        destroyOnClose
      >
        {apiId && subResource && (currentAction === 'create' || selectedItem) && (
          <ResourceActionForm
            apiId={apiId}
            resource={subResource}
            action={currentAction}
            initialData={currentAction === 'edit' ? selectedItem : undefined}
            onSuccess={handleFormSuccess}
            onCancel={closeActionForm}
          />
        )}
      </Drawer>

      {/* 删除确认对话框 */}
      {apiId && subResource && itemToDelete && (
        <ResourceDeleteConfirm
          apiId={apiId}
          resource={subResource}
          item={itemToDelete}
          open={showDeleteConfirm}
          onSuccess={handleDeleteSuccess}
          onCancel={closeDeleteConfirm}
        />
      )}
    </>
  );
};

export default SingleSubResourceList;
