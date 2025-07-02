/**
 * 错误处理器
 * 负责处理和分类各种API错误
 */

import { APIError } from '../types';

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 获取错误消息
   */
  static getErrorMessage(error: any): string {
    if (error instanceof APIError) {
      if (error.validationErrors && error.validationErrors.length > 0) {
        return error.validationErrors.map(ve => `${ve.field}: ${ve.message}`).join(', ');
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * 检查错误类型
   */
  static isValidationError(error: any): error is APIError {
    return error instanceof APIError && 
           Boolean(error.validationErrors) && 
           error.validationErrors!.length > 0;
  }

  /**
   * 检查是否为网络错误
   */
  static isNetworkError(error: any): boolean {
    return error instanceof APIError && error.status === 0;
  }

  /**
   * 检查是否为认证错误
   */
  static isAuthError(error: any): boolean {
    return error instanceof APIError && (error.status === 401 || error.status === 403);
  }

  /**
   * 检查是否为服务器错误
   */
  static isServerError(error: any): boolean {
    return error instanceof APIError && error.status >= 500;
  }
}
