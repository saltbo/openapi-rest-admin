/**
 * 资源相关的工具函数
 * 注意: 大部分资源查找和管理功能已迁移到 ResourceManager 服务
 * @see ~/services/ResourceManager
 */

import type { ParsedResource } from '~/types/api';

/**
 * 获取资源的显示名称
 * 优先使用 displayName，否则使用 name
 */
export function getResourceDisplayName(resource: ParsedResource): string {
  return resource.displayName || resource.name;
}
