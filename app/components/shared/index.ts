export { JsonViewer } from "./JsonViewer";
export { ResourceBreadcrumb } from "./ResourceBreadcrumb";
export {
  ErrorPage,
  NotFoundPage,
  GeneralErrorPage,
  NetworkErrorPage,
  PermissionErrorPage,
} from "./ErrorPage";

// 工具函数：首字母大写
export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
