import React, { useCallback } from 'react';
import { Modal, Typography, Space, Tag, Descriptions, message } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OpenAPIService, PathParamResolver, type ResourceDataItem, type ResourceInfo } from '~/lib/core';

const { Text, Paragraph } = Typography;

interface ResourceDeleteConfirmProps {
  service: OpenAPIService;
  resource: ResourceInfo;
  item: ResourceDataItem;
  open: boolean;
  onSuccess?: () => void;
  onCancel: () => void;
}

export const ResourceDeleteConfirm: React.FC<ResourceDeleteConfirmProps> = ({
  service,
  resource,
  item,
  open,
  onSuccess,
  onCancel
}) => {
  const queryClient = useQueryClient();

  // 删除资源项
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // 获取资源的删除操作
      const deleteOperation = resource.operations.find(op => op.method === 'DELETE');
      if (!deleteOperation) {
        throw new Error(`资源 '${resource.name}' 不支持删除操作`);
      }
      
      const pathParams = PathParamResolver.extractPathParams(resource.pathPattern);
      pathParams[resource.identifierField] = service.getResourceIdentifier(resource.name, item);

      // 使用RESTful API客户端执行删除
      const client = service.getClient();
      return await client.request(deleteOperation, resource.schema!, { pathParams });
    },
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['resourceListData', resource.name] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    },
  });

  const loading = deleteMutation.isPending;
  // 生成要显示的关键字段
  const getDisplayFields = () => {
    const keyFields = ['id', 'name', 'title', 'email', 'username'];
    const fields: Array<{ key: string; value: any }> = [];
    
    // 优先显示关键字段
    keyFields.forEach(key => {
      if (item[key] !== undefined && item[key] !== null) {
        fields.push({ key, value: item[key] });
      }
    });
    
    // 如果关键字段不够，添加其他字段
    if (fields.length < 3) {
      Object.keys(item).forEach(key => {
        if (!keyFields.includes(key) && fields.length < 5) {
          const value = item[key];
          if (value !== undefined && value !== null) {
            fields.push({ key, value });
          }
        }
      });
    }
    
    return fields.slice(0, 5); // 最多显示5个字段
  };

  const displayFields = getDisplayFields();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      // 错误处理已在mutation中处理
      console.error('Delete confirm error:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DeleteOutlined style={{ color: '#ff4d4f' }} />
          <span>确认删除</span>
        </Space>
      }
      open={open}
      onOk={handleConfirm}
      onCancel={onCancel}
      okText="删除"
      cancelText="取消"
      okType="danger"
      confirmLoading={loading}
      destroyOnClose
      width={500}
    >
      <div style={{ marginBottom: '16px' }}>
        <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
        <Text strong>
          您即将删除以下 {resource.name} 数据，此操作不可撤销！
        </Text>
      </div>

      <Paragraph type="secondary">
        请确认要删除的数据信息：
      </Paragraph>

      <div style={{ 
        background: '#fafafa', 
        border: '1px solid #d9d9d9', 
        borderRadius: '6px', 
        padding: '16px',
        marginBottom: '16px'
      }}>
        <Descriptions size="small" column={1}>
          {displayFields.map(({ key, value }) => (
            <Descriptions.Item 
              key={key} 
              label={key}
            >
              {typeof value === 'boolean' ? (
                <Tag color={value ? 'green' : 'red'}>
                  {value ? '是' : '否'}
                </Tag>
              ) : typeof value === 'object' ? (
                <Tag color="blue">Object</Tag>
              ) : Array.isArray(value) ? (
                <Tag color="purple">{value.length} 项</Tag>
              ) : (
                <Text>
                  {String(value).length > 50 
                    ? `${String(value).substring(0, 50)}...` 
                    : String(value)
                  }
                </Text>
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>

      <Paragraph type="warning" style={{ margin: 0 }}>
        <ExclamationCircleOutlined style={{ marginRight: '4px' }} />
        删除后数据将无法恢复，请谨慎操作！
      </Paragraph>
    </Modal>
  );
};

export default ResourceDeleteConfirm;
