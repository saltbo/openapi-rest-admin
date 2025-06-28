import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { 
  Card, 
  Typography, 
  Spin, 
  Alert, 
  Button, 
  Space, 
  Breadcrumb,
  Descriptions,
  Table,
  Tag,
  Modal,
  Tooltip
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { JsonViewer } from '../../components/JsonViewer';
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

  // 从splat中解析资源路径
  // URL可能是: /{itemId} 或 /{parentId}/{subResource}/{subResourceId}
  const pathSegments = splat ? splat.split('/').filter(Boolean) : [];
  const isSubResourceDetail = pathSegments.length >= 3; // 至少3段表示是子资源详情
  
  let currentResourceName: string;
  let currentItemId: string;
  let parentResourceName: string | null = null;
  let parentItemId: string | null = null;
  
  if (isSubResourceDetail) {
    // 子资源详情: /parentId/subResourceName/subResourceId
    parentItemId = pathSegments[0];
    currentResourceName = pathSegments[1];
    currentItemId = pathSegments[2];
    parentResourceName = rName || null; // rName是父资源名
  } else {
    // 顶级资源详情: /itemId
    currentResourceName = rName || '';
    currentItemId = pathSegments[0] || '';
  }

  useEffect(() => {
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
        parentResourceName,
        parentItemId,
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
      
      // 查找当前资源（支持在所有层级中查找，包括子资源）
      const findResourceInAll = (resources: ParsedResource[], targetName: string): ParsedResource | null => {
        for (const resource of resources) {
          if (resource.name === targetName) {
            return resource;
          }
          // 递归查找子资源
          if (resource.sub_resources && resource.sub_resources.length > 0) {
            const found = findResourceInAll(resource.sub_resources, targetName);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      const resource = findResourceInAll(analysisResponse.data.resources, currentResourceName);
      if (!resource) {
        throw new Error(`Resource ${currentResourceName} not found`);
      }
      setCurrentResource(resource);
      
      // 加载当前资源项的详情
      let itemResponse;
      if (isSubResourceDetail && parentResourceName && parentItemId) {
        // 对于子资源，我们目前使用模拟数据，因为真实的子资源API可能需要不同的实现
        // 这里先使用主资源的数据作为示例
        const parentDataResponse = await apiService.getResourceData(apiConfig.id, parentResourceName, 1, 50);
        const parentItem = parentDataResponse.data.find((item: any) => item.id.toString() === parentItemId);
        if (!parentItem) {
          throw new Error(`Parent resource item with id ${parentItemId} not found`);
        }
        // 模拟子资源项数据
        setCurrentItem({
          id: currentItemId,
          parentId: parentItemId,
          parentResource: parentResourceName,
          name: `${currentResourceName}_${currentItemId}`,
          description: `This is a sub-resource item of ${parentResourceName}`,
          // 添加一些模拟字段
          status: 'active',
          createdAt: new Date().toISOString(),
          type: currentResourceName
        });
      } else {
        // 对于顶级资源，直接获取项目详情
        itemResponse = await apiService.getResourceItem(apiConfig.id, currentResourceName, currentItemId);
        setCurrentItem(itemResponse.data);
      }
      
      // 查找并加载子资源（支持多级嵌套）
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        setSubResources(resource.sub_resources);
        
        // 加载每个子资源的数据
        const subResourceDataMap: { [key: string]: ResourceItem[] } = {};
        for (const subResource of resource.sub_resources) {
          try {
            // 由于子资源的API实现可能比较复杂，这里先使用模拟数据
            // 在实际应用中，你可能需要实现专门的子资源API
            const mockSubResourceData: ResourceItem[] = Array.from({ length: 3 }, (_, index) => ({
              id: `${subResource.name}_${index + 1}`,
              name: `${subResource.name} Item ${index + 1}`,
              description: `This is a ${subResource.name} related to ${currentResourceName}`,
              status: index % 2 === 0 ? 'active' : 'inactive',
              createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
              parentId: currentItemId,
              parentResource: currentResourceName
            }));
            subResourceDataMap[subResource.name] = mockSubResourceData;
          } catch (error) {
            console.warn(`Failed to load sub-resource ${subResource.name}:`, error);
            subResourceDataMap[subResource.name] = [];
          }
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
    // 导航到子资源的详情页面，保持父资源的上下文
    // URL格式: /services/{sName}/resources/{parentResource}/{parentId}/{subResource}/{subResourceId}
    navigate(`/services/${encodeURIComponent(sName!)}/resources/${currentResourceName}/${currentItemId}/${subResourceName}/${record.id}`);
  };

  const generateSubResourceColumns = (subResourceName: string, data: ResourceItem[]) => {
    if (data.length === 0) return [];
    
    // 基于数据生成列
    const sampleData = data[0];
    const fieldNames = Object.keys(sampleData);
    
    // 计算每列的合适宽度
    const getColumnWidth = (fieldName: string, data: any[]) => {
      const maxLength = Math.max(
        fieldName.length,
        ...data.slice(0, 5).map(item => {
          const value = item[fieldName];
          if (value === null || value === undefined) return 1;
          return String(value).length;
        })
      );
      return Math.min(Math.max(maxLength * 8 + 32, 80), 150);
    };
    
    const columns = fieldNames.slice(0, 4).map((fieldName) => ({ // 只显示前4个字段
      title: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      dataIndex: fieldName,
      key: fieldName,
      width: getColumnWidth(fieldName, data),
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => {
        if (text === null || text === undefined) return <Text type="secondary">-</Text>;
        if (typeof text === 'object') {
          const jsonStr = JSON.stringify(text);
          return (
            <Tooltip title={jsonStr}>
              <Tag color="blue" style={{ 
                maxWidth: '120px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              }}>
                {jsonStr.substring(0, 20)}...
              </Tag>
            </Tooltip>
          );
        }
        const textStr = String(text);
        if (textStr.length > 30) {
          return (
            <Tooltip title={textStr}>
              <Text 
                style={{ 
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px',
                  cursor: 'pointer'
                }}
              >
                {textStr}
              </Text>
            </Tooltip>
          );
        }
        return textStr;
      },
    }));

    // 添加操作列
    columns.push({
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: ResourceItem) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleSubResourceItemClick(subResourceName, record);
            }}
          >
            查看
          </Button>
        </Space>
      ),
    } as any);

    return columns;
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
                color="blue"
                onClick={() => setShowJsonModal(true)} 
                style={{ 
                  cursor: 'pointer',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block'
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
      padding: '24px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to={`/services/${encodeURIComponent(sName!)}`}>{sName}</Link>
        </Breadcrumb.Item>
        {isSubResourceDetail && parentResourceName ? (
          <>
            <Breadcrumb.Item>
              <Link to={`/services/${encodeURIComponent(sName!)}/resources/${parentResourceName}`}>
                {parentResourceName}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to={`/services/${encodeURIComponent(sName!)}/resources/${parentResourceName}/${parentItemId}`}>
                {parentItemId}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to={`/services/${encodeURIComponent(sName!)}/resources/${currentResourceName}`}>
                {currentResourceName}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{currentItemId}</Breadcrumb.Item>
          </>
        ) : (
          <>
            <Breadcrumb.Item>
              <Link to={`/services/${encodeURIComponent(sName!)}/resources/${currentResourceName}`}>
                {currentResource.name}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{currentItemId}</Breadcrumb.Item>
          </>
        )}
      </Breadcrumb>

      {/* 页面头部 */}
      <Card 
        bordered={false}
        style={{
          marginBottom: '24px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1, 
            minWidth: '300px' 
          }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => {
                if (isSubResourceDetail && parentResourceName && parentItemId) {
                  // 如果是子资源详情，返回到父资源详情页
                  navigate(`/services/${encodeURIComponent(sName!)}/resources/${parentResourceName}/${parentItemId}`);
                } else {
                  // 如果是顶级资源详情，返回到资源列表页
                  navigate(`/services/${encodeURIComponent(sName!)}/resources/${currentResourceName}`);
                }
              }}
              style={{ marginRight: '16px' }}
            >
              {isSubResourceDetail ? '返回父资源' : '返回列表'}
            </Button>
            <div>
              <Title level={2} style={{ margin: 0, marginBottom: '4px' }}>
                {currentResource.name} 详情
              </Title>
              <Text type="secondary">
                ID: {currentItemId}
              </Text>
            </div>
          </div>
          <Space wrap>
            <Button icon={<EditOutlined />}>编辑</Button>
            <Button danger icon={<DeleteOutlined />}>删除</Button>
            <Button type="primary" onClick={() => setShowJsonModal(true)}>
              查看原始数据
            </Button>
          </Space>
        </div>
      </Card>

      {/* 资源详情信息 */}
      <Card 
        title="基本信息" 
        bordered={false}
        style={{
          marginBottom: '24px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        }}
      >
        <Descriptions 
          bordered 
          size="middle" 
          column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
          labelStyle={{ 
            backgroundColor: '#fafafa',
            fontWeight: 500,
            width: '120px'
          }}
          contentStyle={{
            backgroundColor: '#fff'
          }}
        >
          {generateItemDescriptions()}
        </Descriptions>
      </Card>

      {/* 子资源列表 */}
      {subResources.length > 0 && (
        <div>
          <Title level={3} style={{ marginBottom: '16px', color: '#262626' }}>
            关联资源
          </Title>
          {subResources.map((subResource) => {
            const data = subResourceData[subResource.name] || [];
            return (
              <Card 
                key={subResource.name}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text strong>{subResource.name}</Text>
                      <Tag color="blue">{data.length} 项</Tag>
                    </Space>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={() => {
                        // 导航到新建子资源页面
                        navigate(`/services/${encodeURIComponent(sName!)}/resources/${subResource.name}/new?parent=${currentResourceName}&parentId=${currentItemId}`);
                      }}
                    >
                      新增
                    </Button>
                  </div>
                }
                bordered={false}
                style={{ 
                  marginBottom: '16px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
                }}
              >
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
                      `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                  onRow={(record) => ({
                    style: { cursor: 'pointer' },
                    onClick: () => handleSubResourceItemClick(subResource.name, record),
                  })}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* JSON数据模态框 */}
      <Modal
        title="原始数据"
        open={showJsonModal}
        onCancel={() => setShowJsonModal(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        <JsonViewer data={currentItem} />
      </Modal>
    </div>
  );
};

export default ResourceDetail;
