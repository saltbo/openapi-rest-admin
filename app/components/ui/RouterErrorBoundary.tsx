import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";
import { ErrorPage } from "../shared/ErrorPage";

export function RouterErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // 处理路由错误响应
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return (
          <ErrorPage
            status={404}
            title="页面未找到"
            message="您访问的页面不存在，请检查 URL 是否正确。"
            showHome={true}
            showReload={false}
          />
        );
      case 401:
        return (
          <ErrorPage
            status={401}
            title="未授权访问"
            message="您需要登录才能访问此页面。"
            showHome={true}
            showReload={false}
          />
        );
      case 403:
        return (
          <ErrorPage
            status={403}
            title="访问被拒绝"
            message="您没有权限访问此页面。"
            showHome={true}
            showReload={false}
          />
        );
      case 500:
        return (
          <ErrorPage
            status={500}
            title="服务器错误"
            message="服务器内部错误，请稍后重试。"
            showHome={true}
            showReload={true}
          />
        );
      default:
        return (
          <ErrorPage
            status={error.status}
            title={`错误 ${error.status}`}
            message={error.statusText || "发生了一个未知错误"}
            showHome={true}
            showReload={true}
          />
        );
    }
  }

  // 处理其他类型的错误
  if (error instanceof Error) {
    return (
      <ErrorPage
        status={500}
        title="应用程序错误"
        message={error.message || "发生了一个意外错误"}
        stack={process.env.NODE_ENV === "development" ? error.stack : undefined}
        showHome={true}
        showReload={true}
        showDetails={process.env.NODE_ENV === "development"}
      />
    );
  }

  // 处理未知错误类型
  return (
    <ErrorPage
      status={500}
      title="未知错误"
      message="发生了一个未知的错误，请刷新页面重试。"
      showHome={true}
      showReload={true}
    />
  );
}
