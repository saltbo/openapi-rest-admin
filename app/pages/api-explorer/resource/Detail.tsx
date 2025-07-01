import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Modal } from 'antd';
import { JsonViewer } from '~/components/shared/JsonViewer';
import { ResourceBreadcrumb } from '~/components/shared/ResourceBreadcrumb';
import { ResourceHeader } from '~/pages/api-explorer/resource/components/ResourceHeader';
import { ResourceInfoCard } from '~/pages/api-explorer/resource/components/ResourceInfoCard';
import { SubResourcesContainer } from '~/pages/api-explorer/resource/components/SubResourcesContainer';
import { buildPathToLevel, parseResourcePath } from '~/utils/resourceRouting';
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
  const [jsonData, setJsonData] = useState<any>(null);
  
  // 解析资源路径信息
  const { 
    currentResourceName, 
    resourceHierarchy 
  } = parseResourcePath(splat || '', rName || '');

  const currentLevel = resourceHierarchy[resourceHierarchy.length - 1];
  const currentItemId = currentLevel.itemId || '';
  const isSubResourceDetail = resourceHierarchy.length > 1;

  // 显示JSON数据
  const handleShowJson = (data: any) => {
    setJsonData(data);
    setShowJsonModal(true);
  };

  // 处理数据加载
  const handleDataLoaded = (data: any) => {
    setJsonData(data);
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
      const parentListUrl = buildPathToLevel(
        sName!, 
        resourceHierarchy.slice(0, -1),
        resourceHierarchy.length - 2,
        true
      );
      navigate(parentListUrl);
    }
  };

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
          resourceName={capitalizeFirst(currentResourceName)}
          itemId={currentItemId}
          isSubResourceDetail={isSubResourceDetail}
          resourceHierarchy={resourceHierarchy}
          onShowJson={() => handleShowJson(jsonData)}
        />

        {/* 资源详情信息 */}
        <ResourceInfoCard 
          serviceName={sName}
          resourceName={rName}
          itemId={currentItemId}
          nestedPath={splat}
          apiId={apiId}
          onDeleteSuccess={handleDeleteSuccess}
          onDataLoaded={handleDataLoaded}
        />

        {/* 子资源列表 */}
        <SubResourcesContainer
          serviceName={sName}
          resourceName={rName}
          itemId={currentItemId}
          nestedPath={splat}
          apiId={apiId}
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
          <JsonViewer data={jsonData} />
        </Modal>
      </div>
    </div>
  );
};

export default ResourceDetail;
