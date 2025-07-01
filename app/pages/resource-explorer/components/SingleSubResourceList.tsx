import React, { useState } from "react";
import { Card, Typography, Button, Drawer, Spin, Alert } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useResourceDialogs } from "~/pages/resource-explorer/hooks/useResourceDialogs";
import { useResourceList } from "~/pages/resource-explorer/hooks/useResourceList"; // TODO: 文件名拼写错误
import { ResourceActionForm } from "~/pages/resource-explorer/components/ResourceActionForm";
import { ResourceDeleteConfirm } from "~/pages/resource-explorer/components/ResourceDeleteConfirm";
import { useResource } from "../hooks/useResource";
import { capitalizeFirst } from "~/components";
import { Table } from "~/components/json-schema-ui/themes/antd";
import type { ResourceInfo } from "~/lib/api";
import { PathParamResolver } from "~/lib/api";

const { Title } = Typography;

interface SingleSubResourceListProps {
  subResource: ResourceInfo;
}

export const SingleSubResourceList: React.FC<SingleSubResourceListProps> = ({
  subResource,
}) => {
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
      console.log(
        `SingleSubResourceList - Navigating to detail for ${subResource.name}:`,
        record
      );

      const id = service?.getResourceIdentifier(subResource.name, record);
      if (!id) {
        console.warn(
          "Cannot navigate to detail: no identifier found for record"
        );
        return location.pathname;
      }

      // 从当前路径参数构建详情页路径
      const currentParams = { ...pathParams };

      // 添加当前记录的ID
      currentParams[subResource.identifierField] = String(id);

      // 构建详情页路径
      const detailPath = PathParamResolver.buildPath(
        subResource.pathPattern,
        currentParams
      );

      return `/services/${resourceIdentifier.serviceName}/resources${detailPath}`;
    },
    onEdit: (record: any) => {
      handleEdit(record);
    },
    onDelete: (record: any) => {
      handleDelete(record);
    },
  };

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized || loading) {
    return (
      <Card
        title={
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
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)",
          background: "#fff",
          overflow: "hidden",
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
          padding: "16px 24px",
        }}
        bodyStyle={{
          padding: "0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card
        title={
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
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)",
          background: "#fff",
          overflow: "hidden",
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
          padding: "16px 24px",
        }}
        bodyStyle={{
          padding: "24px",
        }}
      >
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!tableSchema) {
    return (
      <Card
        title={
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
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)",
          background: "#fff",
          overflow: "hidden",
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
          padding: "16px 24px",
        }}
        bodyStyle={{
          padding: "24px",
        }}
      >
        <Alert
          message="无法加载表格"
          description={`无法找到资源 "${subResource.name}" 的表格定义。`}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
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
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)",
          background: "#fff",
          overflow: "hidden",
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
          padding: "16px 24px",
        }}
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
