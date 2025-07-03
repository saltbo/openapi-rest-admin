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
import { OpenAPIService, PathParamResolver, SchemaRenderer } from '~/lib/core';
import type { ResourceInfo, ResourceDataItem } from '~/lib/core';
import { ResourceLoading } from './ResourceLoading';
import { useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

export type ActionType = 'create' | 'edit';

interface ResourceActionFormProps {
  service: OpenAPIService;
  resource: ResourceInfo;
  action: ActionType;
  initialData?: ResourceDataItem;
  onSuccess?: () => void;
  onCancel: () => void;
  title?: string;
}

export const ResourceActionForm: React.FC<ResourceActionFormProps> = ({
  service,
  resource,
  action,
  initialData,
  onSuccess,
  onCancel,
  title
}) => {
  const location = useLocation();
  const resourcePath = location.pathname.substring(2); // 去掉前缀 "/r"
  const queryClient = useQueryClient();
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema>({});
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 提取表单初始化逻辑
  const initializeForm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 检查服务是否可用
      if (!service) {
        throw new Error('服务未初始化');
      }
      
      // 直接通过 getResourceFormSchema 获取所有表单渲染数据
      const formSchema = service.getResourceFormSchema(resource, {
        action,
        initialData,
      });
      
      if (!formSchema || !formSchema.schema) {
        throw new Error(`无法获取资源 ${resource.name} 的表单配置`);
      }
      
      setSchema(formSchema.schema);
      setUiSchema(formSchema.uiSchema || {});
      setFormData(formSchema.formData || {});
    } catch (error) {
      console.error('Failed to initialize form:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`初始化表单失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 初始化API服务和Schema
  useEffect(() => {
    initializeForm();
  }, [resource.name, action, initialData, service]);

  // 通用的成功处理函数
  const handleMutationSuccess = (actionText: string) => {
    message.success(`${actionText}成功`);
    queryClient.invalidateQueries({ queryKey: ['resourceListData', resource.name] });
    queryClient.invalidateQueries({ queryKey: ['resourceDetail'] });
    onSuccess?.();
  };

  // 通用的错误处理函数
  const handleMutationError = (error: unknown, actionText: string) => {
    console.error(`${actionText} error:`, error);
    message.error(`${actionText}失败: ${error instanceof Error ? error.message : '未知错误'}`);
  };

  // 创建资源mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!service) throw new Error('API服务未初始化');
      
      // 获取资源的创建操作
      const createOperation = resource.operations.find(op => op.method === 'POST');
      if (!createOperation) throw new Error(`Create operation not found for ${resource.name}`);
      

      const client = service.getClient();
      const pathParams = PathParamResolver.extractPathParams(resourcePath, resource.pathPattern);
      const response = await client.request(createOperation, resource.schema!, {pathParams, body: data});
      return response;
    },
    onSuccess: () => handleMutationSuccess('添加'),
    onError: (error) => handleMutationError(error, '添加'),
  });

  // 更新资源mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!service) throw new Error('API服务未初始化');
      
      // 获取资源的更新操作
      const updateOperation = resource.operations.find(op => 
        op.method === 'PUT' || op.method === 'PATCH'
      );
      if (!updateOperation) throw new Error(`Update operation not found for ${resource.name}`);
      
      const client = service.getClient();
      const pathParams = PathParamResolver.extractPathParams(resourcePath, resource.pathPattern);
      pathParams[resource.identifierField] = service.getResourceIdentifier(resource.name, initialData);
      const response = await client.request(updateOperation, resource.schema!, { pathParams, body: data});
      return response;
    },
    onSuccess: () => handleMutationSuccess('更新'),
    onError: (error) => handleMutationError(error, '更新'),
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

  // 统一处理加载和错误状态
  if (loading || error || !schema || (schema && Object.keys(schema.properties || {}).length === 0)) {
    let errorMessage = "";
    let errorTitle = "";
    let showRetry = false;
    let retryHandler = undefined;

    if (loading) {
      // 正在加载
    } else if (error) {
      errorMessage = error;
      errorTitle = "表单初始化失败";
      showRetry = true;
      retryHandler = () => {
        setError(null);
        initializeForm();
      };
    } else if (!schema || Object.keys(schema.properties || {}).length === 0) {
      errorMessage = `当前资源 "${resource.name}" 没有定义Schema结构，无法生成表单`;
      errorTitle = "缺少资源Schema";
      showRetry = false;
    }

    return (
      <ResourceLoading
        loading={loading}
        error={errorMessage || undefined}
        loadingText="正在加载表单..."
        errorTitle={errorTitle}
        onRetry={retryHandler}
        showRetry={showRetry}
        style={{
          padding: '24px',
          backgroundColor: '#fafafa',
          minHeight: '100%'
        }}
      />
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
