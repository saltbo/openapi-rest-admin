import React, { useState, useEffect } from 'react';
import { Typography, Spin, Alert } from 'antd';
import { SingleSubResourceList } from './SingleSubResourceList';
import { useOpenAPIService, useResourceInfo } from '~/hooks/useOpenAPIService';
import { parseResourcePath } from '~/utils/resourceRouting';
import type { ResourceInfo } from '~/lib/api';

const { Title } = Typography;

interface SubResourcesContainerProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  apiId?: string;
}

export const SubResourcesContainer: React.FC<SubResourcesContainerProps> = ({
  serviceName,
  resourceName,
  itemId,
  nestedPath,
  apiId
}) => {
  const [loading, setLoading] = useState(true);
  const [subResources, setSubResources] = useState<ResourceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized } = useOpenAPIService(serviceName);

  // 解析资源路径
  const { currentResourceName } = parseResourcePath(nestedPath || '', resourceName || '');

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);

  // 加载子资源信息
  const loadSubResources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !itemId) {
        setSubResources([]);
        return;
      }

      // 处理子资源
      if (resource.subResources && resource.subResources.length > 0) {
        setSubResources(resource.subResources);
      } else {
        setSubResources([]);
      }
      
    } catch (error) {
      console.error('Failed to load sub-resources:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && itemId) {
      loadSubResources();
    }
  }, [isInitialized, service, resource, itemId]);

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized || loading) {
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
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
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

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
        {subResources.map((subResource) => (
          <SingleSubResourceList
            key={subResource.name}
            serviceName={serviceName}
            resourceName={resourceName}
            itemId={itemId}
            nestedPath={nestedPath}
            subResource={subResource}
            apiId={apiId}
          />
        ))}
      </div>
    </div>
  );
};

export default SubResourcesContainer;
