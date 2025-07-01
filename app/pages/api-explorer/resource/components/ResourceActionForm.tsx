import React, { useEffect, useState } from 'react';
import { Button, Space, Typography, message, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  EditOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Form from '@rjsf/antd';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { OpenAPIService, SchemaRenderer } from '~/lib/api';
import type { ResourceInfo } from '~/lib/api';
import { openAPIDocumentClient } from '~/lib/client';
import type { ResourceDataItem } from '~/types/api';
import type { OpenAPIV3 } from 'openapi-types';

const { Title, Text } = Typography;

export type ActionType = 'create' | 'edit';

interface ResourceActionFormProps {
  apiId: string;
  resource: ResourceInfo;
  action: ActionType;
  initialData?: ResourceDataItem;
  onSuccess?: () => void;
  onCancel: () => void;
  title?: string;
}

export const ResourceActionForm: React.FC<ResourceActionFormProps> = ({
  apiId,
  resource,
  action,
  initialData,
  onSuccess,
  onCancel,
  title
}) => {
  const queryClient = useQueryClient();
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema>({});
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [apiService, setApiService] = useState<OpenAPIService | null>(null);

  // 初始化API服务和Schema
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setLoading(true);
        // 获取API配置
        const config = await openAPIDocumentClient.getConfig(apiId);
        // 创建API服务实例
        const service = new OpenAPIService(config.openapi_url);
        await service.initialize(config.openapi_url);
        setApiService(service);
        // 直接通过 getResourceFormSchema 获取所有表单渲染数据
        const formSchema = service.getResourceFormSchema(resource.name, {
          action,
          initialData,
        });
        setSchema(formSchema.schema);
        setUiSchema(formSchema.uiSchema);
        setFormData(formSchema.formData || {});
      } catch (error) {
        console.error('Failed to initialize form:', error);
        message.error('初始化表单失败');
      } finally {
        setLoading(false);
      }
    };
    initializeForm();
  }, [apiId, resource.name, action, initialData]);

  // 创建资源mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!apiService) throw new Error('API服务未初始化');
      
      // 获取资源的创建操作
      const allResources = apiService.getAllResources();
      const resourceInfo = allResources.find(r => r.name === resource.name);
      if (!resourceInfo) throw new Error(`Resource ${resource.name} not found`);
      
      const createOperation = resourceInfo.operations.find(op => op.method === 'POST');
      if (!createOperation) throw new Error(`Create operation not found for ${resource.name}`);
      
      const client = apiService.getClient();
      const response = await client.request(createOperation, {body: data});
      return response;
    },
    onSuccess: () => {
      message.success('添加成功');
      queryClient.invalidateQueries({ queryKey: ['resourceData', apiId, resource.name] });
      queryClient.invalidateQueries({ queryKey: ['resourceDetail'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Create error:', error);
      message.error(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
    },
  });

  // 更新资源mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!apiService) throw new Error('API服务未初始化');
      if (!initialData?.id) throw new Error('缺少资源ID');
      
      // 获取资源的更新操作
      const allResources = apiService.getAllResources();
      const resourceInfo = allResources.find(r => r.name === resource.name);
      if (!resourceInfo) throw new Error(`Resource ${resource.name} not found`);
      
      const updateOperation = resourceInfo.operations.find(op => 
        op.method === 'PUT' || op.method === 'PATCH'
      );
      if (!updateOperation) throw new Error(`Update operation not found for ${resource.name}`);
      
      const client = apiService.getClient();
      const response = await client.request(updateOperation, {
        pathParams: { [resourceInfo.identifierField]: initialData.id },
        body: data
      });
      return response;
    },
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['resourceData', apiId, resource.name] });
      queryClient.invalidateQueries({ queryKey: ['resourceDetail'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Update error:', error);
      message.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    },
  });

  const submitting = createMutation.isPending || updateMutation.isPending;

  // 根据操作类型设置默认标题和图标
  const getActionConfig = () => {
    switch (action) {
      case 'create':
        return {
          title: title || `添加新的 ${resource.name}`,
          icon: <PlusOutlined />,
          buttonText: '保存',
          buttonIcon: <SaveOutlined />
        };
      case 'edit':
        return {
          title: title || `编辑 ${resource.name}`,
          icon: <EditOutlined />,
          buttonText: '更新',
          buttonIcon: <SaveOutlined />
        };
    }
  };

  const actionConfig = getActionConfig();

  // 处理表单提交
  const handleSubmit = async (data: { formData?: any }) => {
    try {
      if (!data.formData) return;
      
      // 处理特殊字段类型的值
      const processedData = { ...data.formData };
      
      // 对于编辑操作，合并原始数据
      const finalData = action === 'edit' && initialData 
        ? { ...initialData, ...processedData }
        : processedData;

      // 根据操作类型调用相应的mutation
      if (action === 'create') {
        await createMutation.mutateAsync(finalData);
      } else {
        await updateMutation.mutateAsync(finalData);
      }
      
    } catch (error) {
      // 错误处理已在mutation中处理
      console.error('Form submit error:', error);
    }
  };

  // 如果正在加载或没有schema，显示加载状态
  if (loading || !schema) {
    return (
      <div style={{ 
        padding: '24px', 
        backgroundColor: '#fafafa',
        minHeight: '100%'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '48px 24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <Text>正在加载表单...</Text>
        </div>
      </div>
    );
  }

  // 如果没有schema，显示错误信息
  if (!schema || Object.keys(schema.properties || {}).length === 0) {
    return (
      <div style={{ 
        padding: '24px', 
        backgroundColor: '#fafafa',
        minHeight: '100%'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '48px 24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <QuestionCircleOutlined 
              style={{ 
                fontSize: '48px', 
                color: '#faad14',
                marginBottom: '16px'
              }} 
            />
            <Title level={3} style={{ marginBottom: '8px', color: '#595959' }}>
              缺少资源Schema
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              当前资源 "{resource.name}" 没有定义Schema结构，无法生成表单
            </Text>
          </div>
          <Space size="middle">
            <Button 
              size="large" 
              onClick={onCancel}
              style={{ minWidth: '120px' }}
            >
              返回列表
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#fafafa',
      minHeight: '100%'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '24px'
      }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actionConfig.icon}
              {actionConfig.title}
            </Title>
          </Col>
        </Row>
        
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          validator={validator}
          onSubmit={handleSubmit}
          onChange={({ formData: newFormData }) => setFormData(newFormData)}
          disabled={submitting}
        >
          <div style={{ 
            backgroundColor: 'white', 
            padding: '16px 0', 
            borderTop: '1px solid #f0f0f0',
            marginTop: '24px'
          }}>
            <Row justify="end">
              <Space size="middle">
                <Button 
                  size="large" 
                  onClick={onCancel}
                  disabled={submitting}
                  style={{ minWidth: '80px' }}
                >
                  取消
                </Button>
                <Button 
                  type="primary"
                  size="large"
                  htmlType="submit" 
                  icon={actionConfig.buttonIcon}
                  loading={submitting}
                  style={{ minWidth: '120px' }}
                >
                  {actionConfig.buttonText}
                </Button>
              </Space>
            </Row>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ResourceActionForm;
