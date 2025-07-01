import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Modal, Spin, Alert } from "antd";
import { ResourceBreadcrumb } from "~/components/shared/ResourceBreadcrumb";
import { ResourceHeader } from "~/pages/resource-explorer/components/ResourceHeader";
import { ResourceInfoCard } from "~/pages/resource-explorer/components/ResourceInfoCard";
import { SubResourcesContainer } from "~/pages/resource-explorer/components/SubResourcesContainer";
import { capitalizeFirst } from "~/components";
import { useResource } from "./hooks/useResource";

interface ResourceDetailProps {
  serviceName?: string;
}

// 定义资源数据的类型
type ResourceData = Record<string, any>;

export const ResourceDetail: React.FC<ResourceDetailProps> = ({
  serviceName,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ResourceData | null>(null);
  const { service, resource, pathParams, isInitialized } = useResource();

  // 刷新数据的回调函数
  const refreshData = () => {
    if (service && resource && isInitialized) {
      loadData();
    }
  };

  // Debug 信息（仅在开发模式下显示）
  if (process.env.NODE_ENV === 'development') {
    console.log('ResourceDetail Debug:', {
      isInitialized,
      serviceName,
      resource: resource?.name,
      pathParams,
      currentItem: !!currentItem
    });
  }

  // 加载数据
  const loadData = async () => {
    if (!service || !resource || !isInitialized) {
      return;
    }

    // 检查是否有必要的路径参数
    const hasRequiredParams = resource.identifierField && pathParams[resource.identifierField];
    if (!hasRequiredParams) {
      setError(`Missing required parameter: ${resource.identifierField}`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 查找 GET 单个资源的操作
      const getByIdOperation = resource.operations.find(
        (op) => op.method.toLowerCase() === "get" && op.path.includes("{")
      );

      if (!getByIdOperation) {
        throw new Error(
          `No GET by ID operation found for resource ${resource.name}`
        );
      }

      // 使用新的 API 客户端获取资源详情
      const response = await service
        .getClient()
        .request(getByIdOperation, { pathParams });

      setCurrentItem(response.data);
    } catch (error) {
      console.error("Failed to load resource detail:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 当依赖项变化时重新加载数据
  useEffect(() => {
    if (isInitialized && service && resource) {
      // 只有当我们有必要的路径参数时才加载数据
      const hasRequiredParams = resource.identifierField && pathParams[resource.identifierField];
      if (hasRequiredParams) {
        loadData();
      } else {
        setLoading(false);
        setError(`Missing required parameter: ${resource.identifierField || 'id'}`);
      }
    }
  }, [isInitialized, service, resource, JSON.stringify(pathParams)]);

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: "16px", color: "#666" }}>
          正在初始化服务...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: "16px", color: "#666" }}>
          正在加载资源详情...
        </div>
      </div>
    );
  }

  // 资源不存在的状态
  if (!resource) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert
          message="资源不存在"
          description="请检查URL是否正确或返回上一页"
          type="warning"
          showIcon
          style={{ maxWidth: "500px" }}
        />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ maxWidth: "500px" }}
          action={
            <button
              onClick={() => {
                setError(null);
                loadData();
              }}
              style={{
                background: "#1890ff",
                border: "none",
                color: "white",
                padding: "4px 15px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              重试
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "0",
      }}
    >
      {/* 顶部导航栏 */}
      <div
        style={{
          background: "#fff",
          padding: "16px 24px",
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* <ResourceBreadcrumb
          serviceName={serviceName}
          topLevelResource={topLevelResource}
          nestedPath={nestedPath}
        /> */}
      </div>

      {/* 主内容区域 */}
      <div style={{ 
        padding: "24px", 
        maxWidth: "1400px", 
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* 页面头部 */}
        {resource && currentItem && (
          <ResourceHeader resource={resource} resourceData={currentItem} />
        )}

        {/* 资源详情信息 */}
        {currentItem && resource && (
          <ResourceInfoCard
            service={service!}
            resource={resource}
            resourceData={currentItem}
            onDataChange={refreshData}
          />
        )}

        {/* 子资源列表 */}
        {currentItem && (
          <SubResourcesContainer
            apiId={serviceName} // 使用 serviceName 作为 apiId
          />
        )}
      </div>
    </div>
  );
};

export default ResourceDetail;
