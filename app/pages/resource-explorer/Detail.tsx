import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Modal, Spin, Alert } from "antd";
import { ResourceBreadcrumb } from "~/components/shared/ResourceBreadcrumb";
import { ResourceHeader } from "~/pages/resource-explorer/components/ResourceHeader";
import { ResourceInfoCard } from "~/pages/resource-explorer/components/ResourceInfoCard";
import { SubResourcesContainer } from "~/pages/resource-explorer/components/SubResourcesContainer";
import { ResourceLoading } from "~/pages/resource-explorer/components/ResourceLoading";
import { capitalizeFirst } from "~/components";
import { useResource } from "./hooks/useResource";
import { PathParamResolver } from "~/lib/core";

interface ResourceDetailProps {}

// 定义资源数据的类型
type ResourceData = Record<string, any>;

export const ResourceDetail: React.FC<ResourceDetailProps> = ({}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ResourceData | null>(null);
  const { service, resource, isLoading } = useResource();
  const location = useLocation();
  const resourcePath = location.pathname.substring(2); // 去掉前缀 "/r"

  // 刷新数据的回调函数
  const refreshData = () => {
    if (service && resource && !isLoading) {
      loadData();
    }
  };

  // 加载数据
  const loadData = async () => {
    if (!service || !resource || isLoading) {
      return;
    }

    // 查找 GET 单个资源的操作
    const getByIdOperation = resource.operations.find(
      (op) => op.method.toLowerCase() === "get" && op.path.includes("{")
    );
    if (!getByIdOperation) {
      throw new Error(
        `No GET by ID operation found for resource ${resource.name}`
      );
    }

    const pathParams = PathParamResolver.extractPathParams(
      resourcePath,
      getByIdOperation.path
    );
    console.log(pathParams);

    // 使用新的 API 客户端获取资源详情
    const response = await service
      .getClient()
      .request(getByIdOperation, resource.schema!, { pathParams });
    console.log(response);

    setCurrentItem(response.data);
  };

  // 当依赖项变化时重新加载数据
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      loadData();
    } catch (error) {
      console.error("Failed to load resource detail:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [isLoading, service, resource]);

  // 统一处理加载和错误状态
  if (isLoading || !resource || loading || error) {
    // 确定错误信息和标题
    let errorMessage = "";
    let errorTitle = "";
    let showRetry = false;
    let retryHandler = undefined;
    let loadingText = "正在初始化服务...";

    if (isLoading) {
      // 服务未初始化，显示加载状态
      loadingText = "正在初始化服务...";
    } else if (loading) {
      loadingText = "正在加载资源详情...";
    } else if (!resource) {
      errorMessage = "资源不存在，请检查URL是否正确或返回上一页";
      errorTitle = "资源不存在";
      showRetry = false;
    } else if (error) {
      errorMessage = error;
      errorTitle = "资源详情加载失败";
      showRetry = true;
      retryHandler = () => {
        setError(null);
        loadData();
      };
    }

    return (
      <ResourceLoading
        loading={isLoading}
        error={errorMessage || undefined}
        loadingText={loadingText}
        errorTitle={errorTitle}
        onRetry={retryHandler}
        showRetry={showRetry}
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      />
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
          padding: "0 24px",
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        <ResourceBreadcrumb style={{ marginBottom: "16px" }} />
      </div>

      {/* 主内容区域 */}
      <div
        style={{
          padding: "24px",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
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
        {currentItem && <SubResourcesContainer />}
      </div>
    </div>
  );
};

export default ResourceDetail;
