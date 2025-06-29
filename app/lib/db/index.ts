/**
 * 数据库服务导出
 * 统一导出所有数据库相关的服务和连接
 */

// 数据库连接
export { prisma, disconnectDatabase } from './connection';

// OpenAPI 文档服务
export { OpenAPIDocumentService, openAPIDocumentService } from './openapi-document';
