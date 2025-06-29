import React, { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Space,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  EditOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { frontendAPIService } from '../services';
import type { FieldDefinition, ParsedResource, ResourceDataItem } from '~/types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export type ActionType = 'create' | 'edit';

interface ResourceActionFormProps {
  apiId: string;
  resource: ParsedResource;
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
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 添加资源项
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return frontendAPIService.createResource(apiId, resource.name, data);
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

  // 更新资源项
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!initialData?.id) {
        throw new Error('缺少资源ID');
      }
      return frontendAPIService.updateResource(apiId, resource.name, String(initialData.id), data);
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

  const loading = createMutation.isPending || updateMutation.isPending;

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

  // 初始化表单数据
  useEffect(() => {
    if (initialData && action === 'edit') {
      // 处理日期字段
      const processedData = { ...initialData };
      
      if (resource.schema) {
        resource.schema.forEach(field => {
          const value = processedData[field.name];
          if (value && (field.type === 'date' || field.type === 'datetime')) {
            // 如果是日期字符串，转换为dayjs对象
            if (typeof value === 'string') {
              processedData[field.name] = dayjs(value);
            }
          } else if (value && field.type === 'array' && Array.isArray(value)) {
            // 数组转换为逗号分隔的字符串
            processedData[field.name] = value.join(', ');
          } else if (value && field.type === 'object' && typeof value === 'object') {
            // 对象转换为JSON字符串
            processedData[field.name] = JSON.stringify(value, null, 2);
          }
        });
      }
      
      form.setFieldsValue(processedData);
    } else if (action === 'create') {
      // 创建模式时清空表单
      form.resetFields();
    }
  }, [initialData, action, resource.schema, form]);

  // 根据字段类型渲染表单项
  const renderFormItem = (field: FieldDefinition) => {
    const { name, type, required, description, enum: enumValues, format } = field;

    // 检查是否为ID字段
    const isIdField = ['id', '_id'].includes(name);
    
    // 表单项的基本配置
    const formItemProps = {
      name,
      label: <span style={{ fontWeight: 500 }}>{name}</span>,
      tooltip: description ? {
        title: description,
        placement: 'topLeft' as const,
        color: '#108ee9'
      } : undefined,
      required: isIdField ? false : required, // ID字段不需要必填验证
      rules: isIdField ? [] : [
        {
          required,
          message: `请输入${description || name}`
        }
      ]
    };

    // 如果是编辑模式且为ID字段，显示为只读
    if (action === 'edit' && isIdField) {
      return (
        <Form.Item {...formItemProps}>
          <Input 
            disabled 
            style={{ 
              backgroundColor: '#f5f5f5',
              color: '#999',
              cursor: 'not-allowed'
            }}
            placeholder="系统自动生成"
          />
        </Form.Item>
      );
    }

    // 根据类型渲染不同的输入组件
    switch (type) {
      case 'string':
        if (enumValues && enumValues.length > 0) {
          return (
            <Form.Item {...formItemProps}>
              <Select placeholder={`请选择${description || name}`}>
                {enumValues.map(value => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        } else if (format === 'email') {
          return (
            <Form.Item 
              {...formItemProps}
              rules={[
                ...formItemProps.rules,
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder={`请输入${description || name}`} />
            </Form.Item>
          );
        } else if (format === 'url') {
          return (
            <Form.Item 
              {...formItemProps}
              rules={[
                ...formItemProps.rules,
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder={`请输入${description || name}`} />
            </Form.Item>
          );
        } else {
          const isLongText = description && description.includes('描述') || 
                            name.toLowerCase().includes('desc') || 
                            name.toLowerCase().includes('content') ||
                            name.toLowerCase().includes('note');
          
          return (
            <Form.Item {...formItemProps}>
              {isLongText ? (
                <TextArea 
                  rows={3} 
                  placeholder={`请输入${description || name}`} 
                />
              ) : (
                <Input placeholder={`请输入${description || name}`} />
              )}
            </Form.Item>
          );
        }

      case 'number':
      case 'integer':
        return (
          <Form.Item {...formItemProps}>
            <InputNumber 
              style={{ width: '100%' }}
              placeholder={`请输入${description || name}`}
              precision={type === 'integer' ? 0 : undefined}
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item {...formItemProps} valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item {...formItemProps}>
            <DatePicker 
              style={{ width: '100%' }}
              placeholder={`请选择${description || name}`}
            />
          </Form.Item>
        );

      case 'datetime':
        return (
          <Form.Item {...formItemProps}>
            <DatePicker 
              showTime
              style={{ width: '100%' }}
              placeholder={`请选择${description || name}`}
            />
          </Form.Item>
        );

      case 'array':
        return (
          <Form.Item 
            {...formItemProps}
            help={
              <Space size={4} style={{ fontSize: '12px', color: '#666' }}>
                <QuestionCircleOutlined />
                <span>多个值请用逗号分隔</span>
              </Space>
            }
          >
            <Input placeholder={`请输入${description || name}，多个值用逗号分隔`} />
          </Form.Item>
        );

      case 'object':
        return (
          <Form.Item 
            {...formItemProps}
            help={
              <Space size={4} style={{ fontSize: '12px', color: '#666' }}>
                <QuestionCircleOutlined />
                <span>请输入有效的JSON格式</span>
              </Space>
            }
          >
            <TextArea 
              rows={4} 
              placeholder={`请输入${description || name}的JSON数据`}
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item {...formItemProps}>
            <Input placeholder={`请输入${description || name}`} />
          </Form.Item>
        );
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 处理特殊字段类型的值
      const processedValues = { ...values };
      
      if (resource.schema) {
        resource.schema.forEach(field => {
          const value = processedValues[field.name];
          if (value !== undefined && value !== null) {
            switch (field.type) {
              case 'array':
                if (typeof value === 'string') {
                  processedValues[field.name] = value.split(',').map(v => v.trim()).filter(v => v);
                }
                break;
              
              case 'object':
                if (typeof value === 'string') {
                  try {
                    processedValues[field.name] = JSON.parse(value);
                  } catch (e) {
                    message.error(`字段 ${field.name} 的JSON格式无效`);
                    return;
                  }
                }
                break;
              
              case 'date':
              case 'datetime':
                if (dayjs.isDayjs(value)) {
                  processedValues[field.name] = value.toISOString();
                }
                break;
            }
          }
        });
      }

      // 对于编辑操作，合并原始数据
      const finalData = action === 'edit' && initialData 
        ? { ...initialData, ...processedValues }
        : processedValues;

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

  // 获取表单字段
  const getFormFields = () => {
    if (!resource.schema || resource.schema.length === 0) {
      return [
        { name: 'name', type: 'string' as const, required: true, description: '名称' },
        { name: 'description', type: 'string' as const, required: false, description: '描述' }
      ];
    }
    
    // 创建时过滤掉ID和时间戳字段
    if (action === 'create') {
      return resource.schema.filter(field => 
        !['id', '_id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(field.name)
      );
    }
    
    // 编辑时显示所有字段（包括ID，但ID会是只读的），除了自动生成的时间戳
    return resource.schema.filter(field => 
      !['createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(field.name)
    );
  };

  const formFields = getFormFields();

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#fafafa',
      minHeight: '100%'
    }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
      >
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px'
        }}>
          <Row gutter={[24, 16]}>
            {formFields.map((field) => (
              <Col 
                key={field.name} 
                xs={24} 
                sm={24} 
                md={formFields.length > 4 ? 12 : 24}
                lg={formFields.length > 6 ? 8 : formFields.length > 2 ? 12 : 24}
              >
                {renderFormItem(field)}
              </Col>
            ))}
          </Row>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px 24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderTop: '3px solid #1890ff'
        }}>
          <Row justify="end">
            <Space size="middle">
              <Button 
                size="large" 
                onClick={onCancel}
                style={{ minWidth: '80px' }}
              >
                取消
              </Button>
              <Button 
                type="primary"
                size="large"
                htmlType="submit" 
                icon={actionConfig.buttonIcon}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                {actionConfig.buttonText}
              </Button>
            </Space>
          </Row>
        </div>
      </Form>
    </div>
  );
};

export default ResourceActionForm;
