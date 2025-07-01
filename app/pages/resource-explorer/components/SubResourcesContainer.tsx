import React, { useState, useEffect } from "react";
import { Typography, Spin, Alert } from "antd";
import { SingleSubResourceList } from "./SingleSubResourceList";
import { ResourceLoading } from "./ResourceLoading";
import { useResource } from "../hooks/useResource";
import type { ResourceInfo } from "~/lib/api";

const { Title } = Typography;

interface SubResourcesContainerProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
  apiId?: string;
}

export const SubResourcesContainer: React.FC<SubResourcesContainerProps> = ({
  apiId,
}) => {
  const [loading, setLoading] = useState(true);
  const [subResources, setSubResources] = useState<ResourceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 使用 useResource hook 获取资源信息
  const { service, resource, isInitialized } = useResource();

  // 加载子资源信息
  const loadSubResources = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!service || !resource) {
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
      console.error("Failed to load sub-resources:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource) {
      loadSubResources();
    }
  }, [isInitialized, service, resource]);

  // 提取标题组件
  const SectionTitle = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "24px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "2px",
        }}
      />
      <Title
        level={3}
        style={{
          margin: 0,
          color: "#262626",
          fontSize: "20px",
          fontWeight: "600",
        }}
      >
        关联资源
      </Title>
    </div>
  );

  // 统一处理加载和错误状态
  if (!isInitialized || loading || error) {
    return (
      <div>
        <SectionTitle />
        <ResourceLoading
          loading={!isInitialized || loading}
          error={error || undefined}
          loadingText="正在加载关联资源..."
          errorTitle="关联资源加载失败"
          onRetry={() => {
            setError(null);
            loadSubResources();
          }}
          showRetry={true}
          minHeight="200px"
        />
      </div>
    );
  }

  if (subResources.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionTitle />
      <div style={{ display: "grid", gap: "20px" }}>
        {subResources.map((subResource) => (
          <SingleSubResourceList
            key={subResource.name}
            subResource={subResource}
          />
        ))}
      </div>
    </div>
  );
};

export default SubResourcesContainer;
