/**
 * 操作判断器
 * 负责判断资源操作的类型
 */

import type { ResourceOperation } from '../../OpenAPIDocumentParser';

/**
 * 操作判断器类
 */
export class OperationHelper {
  /**
   * 判断是否为列表操作
   */
  static isListOperation(operation: ResourceOperation): boolean {
    // 判断是否为GET方法且路径不包含参数（表示获取列表）
    if (operation.method.toUpperCase() !== 'GET') {
      return false;
    }
    
    // 结尾不包含参数的认定为列表操作
    return !operation.path.endsWith('}');
  }
}
