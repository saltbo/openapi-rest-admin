import React, { useState } from "react";
import { Card, Typography, Button, Drawer, Spin, Alert } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useResourceDialogs } from "~/pages/resource-explorer/hooks/useResourceDialogs";
import { useResourceList } from "~/pages/resource-explorer/hooks/useResourceList"; // TODO: 文件名拼写错误
import { ResourceActionForm } from "~/pages/resource-explorer/components/ResourceActionForm";
import { ResourceDeleteConfirm } from "~/pages/resource-explorer/components/ResourceDeleteConfirm";
import { ResourceLoading } from "./ResourceLoading";
import { useResource } from "../hooks/useResource";
import { capitalizeFirst } from "~/components";
import { Table } from "~/components/json-schema-ui/themes/antd";
import type { ResourceInfo } from "~/lib/api";
import { PathParamResolver } from "~/lib/api";
import { useNavigate } from "react-router";

const { Title } = Typography;

interface SingleSubResourceListProps {
  subResource: ResourceInfo;
}

export const SingleSubResourceList: React.FC<SingleSubResourceListProps> = ({
  subResource,
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // 使用 useResource hook 获取服务和路径参数
  const { service, pathParams, isInitialized, resourceIdentifier } =
    useResource();

  // 使用 useResourceList hook 获取子资源数据
  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useResourceList(
    service,
    subResource,
    currentPage,
    10, // pageSize
    searchQuery,
    pathParams // 传递路径参数
  );

  const data = queryData?.data || [];
  const error = queryError?.message || null;
  const tableSchema = service?.getResourceTableSchema(subResource.name);

  // 使用 useResourceDialogs hook 管理对话框状态
  const {
    showActionForm,
    currentAction,
    selectedItem,
    showDeleteConfirm,
    itemToDelete,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormSuccess: originalHandleFormSuccess,
    handleDeleteSuccess: originalHandleDeleteSuccess,
    closeActionForm,
    closeDeleteConfirm,
  } = useResourceDialogs();

  // 包装成功处理函数以重新获取数据
  const handleFormSuccess = () => {
    originalHandleFormSuccess();
    refetch(); // 重新获取列表数据
  };

  const handleDeleteSuccess = () => {
    originalHandleDeleteSuccess();
    refetch(); // 重新获取列表数据
  };

  // 处理新增按钮点击
  const handleAddClick = () => {
    console.log(
      `SingleSubResourceList - Adding ${
        subResource.name
      }: operations length = ${subResource.operations?.length || 0}`
    );
    handleAdd();
  };

  const actionHandlers = {
    onDetail: (record: any) => {
      const id = service?.getResourceIdentifier(subResource.name, record);
      if (!id) {
        throw new Error(
          `无法获取资源标识符: ${subResource.name} - ${JSON.stringify(record)}`
        );
      }

      // 从当前路径参数构建详情页路径
      const currentParams = { ...pathParams };
      currentParams[subResource.identifierField] = String(id);

      // 构建详情页路径
      const detailPath = PathParamResolver.buildPath(
        subResource.pathPattern,
        currentParams
      );

      navigate(
        `/services/${resourceIdentifier.serviceName}/resources${detailPath}`
      );
    },
    onEdit: (record: any) => {
      handleEdit(record);
    },
    onDelete: (record: any) => {
      handleDelete(record);
    },
  };

  // 提取卡片标题组件
  const CardTitle = ({ showAddButton = true }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "18px",
        fontWeight: "600",
        color: "#262626",
      }}
    >
      <span>{capitalizeFirst(subResource.name)}</span>
      {showAddButton && (
        <Button
          type="primary"
          size="middle"
          icon={<PlusOutlined />}
          onClick={handleAddClick}
          style={{
            borderRadius: "8px",
            fontWeight: "500",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
          }}
        >
          创建新{subResource.name}
        </Button>
      )}
    </div>
  );

  // 提取卡片样式配置
  const cardStyles = {
    card: {
      borderRadius: "12px",
      boxShadow:
        "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)",
      background: "#fff",
      overflow: "hidden",
    },
    head: {
      borderBottom: "1px solid #f0f0f0",
      background: "#fafafa",
      padding: "16px 24px",
    },
  };

  // 统一处理加载和错误状态
  if (!isInitialized || loading || error || !tableSchema) {
    // 确定错误信息
    let errorMessage = "";
    let errorTitle = "";
    let showRetry = false;
    let retryHandler = undefined;

    if (!isInitialized || loading) {
      // 加载状态
    } else if (error) {
      errorMessage = error;
      errorTitle = "数据加载失败";
      showRetry = true;
      retryHandler = () => refetch();
    } else if (!tableSchema) {
      errorMessage = `无法找到资源 "${subResource.name}" 的表格定义`;
      errorTitle = "无法加载表格";
      showRetry = false;
    }

    return (
      <Card
        title={<CardTitle showAddButton={!loading && !error} />}
        bordered={false}
        style={cardStyles.card}
        headStyle={cardStyles.head}
        bodyStyle={{
          padding: error || !tableSchema ? "24px" : "0",
        }}
      >
        <ResourceLoading
          loading={!isInitialized || loading}
          error={errorMessage || undefined}
          loadingText="正在加载数据..."
          errorTitle={errorTitle}
          onRetry={retryHandler}
          showRetry={showRetry}
          minHeight="200px"
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title={<CardTitle />}
        bordered={false}
        style={cardStyles.card}
        headStyle={cardStyles.head}
        bodyStyle={{
          padding: "0",
        }}
      >
        <Table
          schema={tableSchema}
          data={data}
          loading={loading}
          actionHandlers={actionHandlers}
        />
      </Card>

      {/* 编辑表单抽屉 */}
      <Drawer
        title={`${currentAction === "create" ? "创建" : "编辑"} ${
          subResource.name
        }`}
        placement="right"
        open={showActionForm}
        onClose={closeActionForm}
        width={600}
        destroyOnClose
      >
        {service &&
          subResource &&
          (currentAction === "create" || selectedItem) && (
            <ResourceActionForm
              service={service}
              resource={subResource}
              action={currentAction}
              initialData={currentAction === "edit" ? selectedItem : undefined}
              onSuccess={handleFormSuccess}
              onCancel={closeActionForm}
            />
          )}
      </Drawer>

      {/* 删除确认对话框 */}
      {service && subResource && itemToDelete && (
        <ResourceDeleteConfirm
          service={service}
          resource={subResource}
          item={itemToDelete}
          open={showDeleteConfirm}
          onSuccess={handleDeleteSuccess}
          onCancel={closeDeleteConfirm}
        />
      )}
    </>
  );
};

export default SingleSubResourceList;
