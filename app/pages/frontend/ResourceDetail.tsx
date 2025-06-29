import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Spin, Alert, Modal } from 'antd';
import { JsonViewer } from '../../components/JsonViewer';
import { ResourceBreadcrumb } from '../../components/ResourceBreadcrumb';
import { ResourceHeader } from '../../components/ResourceHeader';
import { ResourceInfoCard } from '../../components/ResourceInfoCard';
import { SubResourcesList } from '../../components/SubResourcesList';
import { buildSubResourceDetailLink, buildNewResourceLink } from '../../utils/resourceRouting';
import { useResourceDetail } from '../../hooks/useResourceDetail';

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
  
  const sName = apiId || params.sName;
  const rName = resourceId || params.rName;
  const splat = params['*'];
  
  const [showJsonModal, setShowJsonModal] = useState(false);
  
  // 使用自定义 hook 管理状态
  const {
    loading,
    error,
    currentItem,
    currentResource,
    subResources,
    subResourceData,
    resourceHierarchy,
    currentResourceName,
    currentItemId,
    isSubResourceDetail
  } = useResourceDetail({ sName, rName, splat });

  // 事件处理函数
  const handleSubResourceItemClick = (subResourceName: string, record: ResourceItem) => {
    const path = buildSubResourceDetailLink(sName!, resourceHierarchy, subResourceName, record.id);
    navigate(path);
  };

  const handleCreateNew = (subResourceName: string) => {
    const newResourceUrl = buildNewResourceLink(sName!, subResourceName, resourceHierarchy);
    navigate(newResourceUrl);
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 错误状态
  if (error || !currentResource || !currentItem) {
    return (
      <Alert
        message="数据加载失败"
        description={error || "无法加载资源详情，请检查配置或刷新页面"}
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
        {/* 页面头部 */}
        <ResourceHeader
          resourceName={currentResource.name}
          itemId={currentItemId}
          isSubResourceDetail={isSubResourceDetail}
          resourceHierarchy={resourceHierarchy}
          onShowJson={() => setShowJsonModal(true)}
        />

        {/* 资源详情信息 */}
        <ResourceInfoCard data={currentItem} />

        {/* 子资源列表 */}
        <SubResourcesList
          subResources={subResources}
          subResourceData={subResourceData}
          serviceName={sName!}
          resourceHierarchy={resourceHierarchy}
          onItemClick={handleSubResourceItemClick}
          onCreateNew={handleCreateNew}
        />

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
    </div>
  );
};

export default ResourceDetail;
