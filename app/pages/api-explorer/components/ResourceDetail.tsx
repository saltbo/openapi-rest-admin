import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Spin, Alert, Modal } from 'antd';
import { JsonViewer } from '~/components/shared/JsonViewer';
import { ResourceBreadcrumb } from '~/components/shared/ResourceBreadcrumb';
import { ResourceHeader } from '~/components/shared/ResourceHeader';
import { ResourceInfoCard } from '~/components/shared/ResourceInfoCard';
import { SubResourcesList } from '~/components/shared/SubResourcesList';
import { buildSubResourceDetailLink, buildNewResourceLink, buildPathToLevel } from '~/utils/resourceRouting';
import { useResourceDetailAPI } from '~/hooks/useResourceDetailAPI';
import { capitalizeFirst } from '~/components';

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
  
  // 使用新的 API hook 管理状态
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
    isSubResourceDetail,
    apiConfig,
    refetch
  } = useResourceDetailAPI({ sName, rName, splat });

  // 事件处理函数
  const handleSubResourceItemClick = (subResourceName: string, record: any) => {
    const path = buildSubResourceDetailLink(sName!, resourceHierarchy, subResourceName, record.id);
    navigate(path);
  };

  const handleCreateNew = (subResourceName: string) => {
    const newResourceUrl = buildNewResourceLink(sName!, subResourceName, resourceHierarchy);
    navigate(newResourceUrl);
  };

  // 删除成功后的处理
  const handleDeleteSuccess = () => {
    // 根据当前资源层次结构，跳转到上级列表页面
    if (resourceHierarchy.length <= 1) {
      // 如果是顶级资源，跳转到顶级资源列表
      const listUrl = `/services/${encodeURIComponent(sName!)}/resources/${rName}`;
      navigate(listUrl);
    } else {
      // 如果是子资源，跳转到上一级的列表页面
      // 构建到上一级（不包含当前级别的itemId）的路径
      const parentListUrl = buildPathToLevel(
        sName!, 
        resourceHierarchy.slice(0, -1), // 移除最后一级（当前级别）
        resourceHierarchy.length - 2,   // 目标是倒数第二级
        true  // 包含itemId，因为我们要显示该级别下的子资源列表
      );
      navigate(parentListUrl);
    }
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
          resourceName={capitalizeFirst(currentResource.name)}
          itemId={currentItemId}
          isSubResourceDetail={isSubResourceDetail}
          resourceHierarchy={resourceHierarchy}
          onShowJson={() => setShowJsonModal(true)}
        />

        {/* 资源详情信息 */}
        <ResourceInfoCard 
          data={currentItem} 
          apiId={apiConfig?.id}
          resource={currentResource}
          onDeleteSuccess={handleDeleteSuccess}
        />

        {/* 子资源列表 */}
        <SubResourcesList
          subResources={subResources}
          subResourceData={subResourceData}
          serviceName={sName!}
          resourceHierarchy={resourceHierarchy}
          onItemClick={handleSubResourceItemClick}
          onCreateNew={handleCreateNew}
          apiId={apiConfig?.id}
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
