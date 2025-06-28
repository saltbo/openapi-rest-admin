import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { 
  Card, 
  Typography, 
  Spin, 
  Alert, 
  Button, 
  Space, 
  Descriptions,
  Table,
  Tag,
  Modal,
  Tooltip
} from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { JsonViewer } from '../../components/JsonViewer';
import { ResourceBreadcrumb } from '../../components/ResourceBreadcrumb';
import { parseResourcePath, buildDetailLink, buildSubResourceDetailLink, buildNewResourceLink } from '../../utils/resourceRouting';
import { findResourceInAll } from '../../utils/resourceUtils';
import { generateTableColumnsFromData } from '../../utils/tableUtils';
import { apiService } from '../../services/api';
import type { OpenAPIAnalysis, ParsedResource } from '../../types/api';

const { Title, Text } = Typography;

interface ResourceItem {
  id: string | number;
  [key: string]: any;
}

interface ResourceDetailProps {
  apiId?: string;
  resourceId?: string;
}

export const ResourceDetail: React.FC<ResourceDetailProps> = ({ apiId, resourceId }) => {
  const params = useParams<{ sName: string; rName: string; '*': string }>();
  const navigate = useNavigate();
  
  // 优先使用 props，如果没有则使用路由参数
  const sName = apiId || params.sName;
  const rName = resourceId || params.rName;
  const splat = params['*'];
  
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<OpenAPIAnalysis | null>(null);
  const [currentItem, setCurrentItem] = useState<ResourceItem | null>(null);
  const [currentResource, setCurrentResource] = useState<ParsedResource | null>(null);
  const [subResources, setSubResources] = useState<ParsedResource[]>([]);
  const [subResourceData, setSubResourceData] = useState<{ [key: string]: ResourceItem[] }>({});
  const [showJsonModal, setShowJsonModal] = useState(false);
  
  // 使用工具函数解析资源路径
  const { 
    currentResourceName, 
    parentContext, 
    resourceHierarchy 
  } = parseResourcePath(splat, rName || '');
  
  // 保留原有的 pathSegments 用于调试日志
  const pathSegments = splat ? splat.split('/').filter(Boolean) : [];
  
  // 当前资源信息（层次结构的最后一级）
  const currentLevel = resourceHierarchy[resourceHierarchy.length - 1];
  const currentItemId = currentLevel.itemId || '';
  
  // 是否为子资源详情
  const isSubResourceDetail = resourceHierarchy.length > 1;

  useEffect(() => {
    // 调试日志：显示解析的资源层次结构
    console.log('=== ResourceDetail Debug Info ===');
    console.log('URL参数:', { sName, rName, splat });
    console.log('路径段:', pathSegments);
    console.log('资源层次结构:', resourceHierarchy);
    console.log('当前资源:', { currentResourceName, currentItemId });
    console.log('是否为子资源详情:', isSubResourceDetail);
    console.log('=================================');
    
    if (sName && currentResourceName && currentItemId) {
      loadData();
    }
  }, [sName, currentResourceName, currentItemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!sName || !currentResourceName || !currentItemId) {
        console.error('Missing required parameters');
        return;
      }
      
      console.log('Loading resource detail for:', { 
        sName, 
        rName,
        currentResourceName, 
        currentItemId, 
        isSubResourceDetail,
        resourceHierarchy,
        pathSegments,
        splat
      });
      
      // 获取API配置
      const apiConfigsResponse = await apiService.getAPIConfigs();
      
      const apiConfig = apiConfigsResponse.data.find(api => 
        api.name === sName || 
        api.id === sName ||
        api.name.toLowerCase().replace(/\s+/g, '-') === sName.toLowerCase() ||
        api.name.toLowerCase().replace(/\s+/g, '') === sName.toLowerCase()
      );
      
      if (!apiConfig) {
        console.error(`Service ${sName} not found`);
        throw new Error(`Service ${sName} not found`);
      }
      
      console.log('Found API config:', apiConfig);
      
      // 获取分析数据
      const analysisResponse = await apiService.getOpenAPIAnalysis(apiConfig.id);
      setAnalysis(analysisResponse.data);
      
      // 使用工具函数查找当前资源
      const resource = findResourceInAll(analysisResponse.data.resources, currentResourceName);
      if (!resource) {
        throw new Error(`Resource ${currentResourceName} not found`);
      }
      setCurrentResource(resource);
      
      // 加载当前资源项的详情
      const itemResponse = await apiService.getResource(apiConfig.id, currentResourceName, currentItemId);
      setCurrentItem(itemResponse.data);
      
      // 查找并加载子资源（支持多级嵌套）
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        setSubResources(resource.sub_resources);
        
        // 加载每个子资源的数据
        const subResourceDataMap: { [key: string]: ResourceItem[] } = {};
        for (const subResource of resource.sub_resources) {
          // 使用统一的资源数据API获取数据
          const subResourceResponse = await apiService.listResources(
            apiConfig.id, 
            subResource.name, 
            1, 
            10
          );
          subResourceDataMap[subResource.name] = subResourceResponse.data;
        }
        setSubResourceData(subResourceDataMap);
      } else {
        // 没有子资源时清除状态
        setSubResources([]);
        setSubResourceData({});
      }
      
    } catch (error) {
      console.error('Failed to load resource detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubResourceItemClick = (subResourceName: string, record: ResourceItem) => {
    // 使用工具函数构建子资源详情链接
    const path = buildSubResourceDetailLink(sName!, resourceHierarchy, subResourceName, record.id);
    navigate(path);
  };

  const generateSubResourceColumns = (subResourceName: string, data: ResourceItem[]) => {
    return generateTableColumnsFromData({
      data,
      maxColumns: 4,
      showActions: true,
      actionHandlers: {
        onDetail: (record: ResourceItem) => {
          handleSubResourceItemClick(subResourceName, record);
          return ''; // 我们手动处理导航，所以返回空字符串
        }
      }
    });
  };

  const generateItemDescriptions = () => {
    if (!currentItem) return [];
    
    return Object.entries(currentItem).map(([key, value]) => {
      const formatValue = () => {
        if (value === null || value === undefined) {
          return <Text type="secondary">-</Text>;
        }
        
        if (typeof value === 'object') {
          const jsonStr = JSON.stringify(value, null, 2);
          return (
            <Tooltip title="点击查看完整JSON数据">
              <Tag 
                color="processing"
                onClick={() => setShowJsonModal(true)} 
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

      return (
        <Descriptions.Item 
          label={
            <Text strong>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
          } 
          key={key}
        >
          {formatValue()}
        </Descriptions.Item>
      );
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!analysis || !currentResource || !currentItem) {
    return (
      <Alert
        message="数据加载失败"
        description="无法加载资源详情，请检查配置或刷新页面"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '0'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <ResourceBreadcrumb 
          serviceName={sName} 
          topLevelResource={rName} 
          nestedPath={splat}
        />
      </div>

      {/* 主内容区域 */}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* 页面头部卡片 */}
        <Card 
          bordered={false}
          style={{
            marginBottom: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            overflow: 'hidden'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              flex: 1, 
              minWidth: '300px' 
            }}>
              <div>
                <Title level={1} style={{ 
                  margin: 0, 
                  marginBottom: '8px', 
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: '600'
                }}>
                  {currentResource.name}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>
                    ID: {currentItemId}
                  </Text>
                  {isSubResourceDetail && (
                    <Tag color="rgba(255, 255, 255, 0.2)" style={{ 
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '2px 8px'
                    }}>
                      {resourceHierarchy.length > 2 ? `${resourceHierarchy.length}级子资源` : '子资源'}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
            <Space wrap size="middle">
              <Button 
                icon={<EditOutlined />} 
                size="large"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff'
                }}
              >
                编辑
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                size="large"
                style={{
                  background: 'rgba(255, 77, 79, 0.8)',
                  border: '1px solid rgba(255, 77, 79, 0.3)',
                  color: '#fff'
                }}
              >
                删除
              </Button>
              <Button 
                type="primary" 
                onClick={() => setShowJsonModal(true)}
                size="large"
                style={{
                  background: '#fff',
                  color: '#667eea',
                  border: 'none',
                  fontWeight: '500'
                }}
              >
                查看原始数据
              </Button>
            </Space>
          </div>
        </Card>

        {/* 资源详情信息 */}
        <Card 
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 0'
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
            {generateItemDescriptions()}
          </Descriptions>
        </Card>

        {/* 子资源列表 */}
        {subResources.length > 0 && (
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
                        padding: '4px 0'
                      }}>
                        <Space align="center">
                          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#262626' }}>
                            {subResource.name}
                          </Text>
                          <Tag 
                            color="processing" 
                            style={{ 
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {data.length} 项
                          </Tag>
                        </Space>
                        <Button 
                          type="primary" 
                          size="middle" 
                          icon={<PlusOutlined />}
                          onClick={() => {
                            // 使用工具函数构建新建页面链接
                            const newResourceUrl = buildNewResourceLink(sName!, subResource.name, resourceHierarchy);
                            navigate(newResourceUrl);
                          }}
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
                        columns={generateSubResourceColumns(subResource.name, data)}
                        dataSource={data}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 'max-content' }}
                        pagination={{ 
                          pageSize: 5, 
                          showSizeChanger: false,
                          showTotal: (total, range) => 
                            `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                          style: { 
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid #f0f0f0'
                          }
                        }}
                        onRow={(record) => ({
                          style: { cursor: 'pointer' },
                          onClick: () => handleSubResourceItemClick(subResource.name, record),
                        })}
                        style={{
                          background: '#fff'
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* JSON数据模态框 */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
              原始数据
            </div>
          }
          open={showJsonModal}
          onCancel={() => setShowJsonModal(false)}
          footer={null}
          width="80%"
          style={{ top: 20 }}
          styles={{
            header: {
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px'
            },
            body: {
              padding: '24px'
            }
          }}
        >
          <JsonViewer data={currentItem} />
        </Modal>
      </div>
    </div>
  );
};

export default ResourceDetail;
