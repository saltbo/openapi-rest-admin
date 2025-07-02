/**
 * 路径参数解析器
 * 用于处理 OpenAPI 路径模式和实际路径之间的参数提取和构建
 */
export class PathParamResolver {
  /**
   * 路由前缀常量，用于从完整URL中提取资源路径部分
   * 格式：/services/{serviceName}/resources/
   */
  static readonly ROUTE_PREFIX_PATTERN = '/services/';

  /**
   * 从当前网页地址中解析出路径参数
   * @param pathPattern 路径模式，如 "/authors/{authorId}/books/{bookId}"
   * @returns 解析出的路径参数对象，如 { authorId: "123", bookId: "456" }
   */
  static extractPathParams(pathPattern: string): Record<string, string> {
    const pathParams: Record<string, string> = {};
    
    // 使用 React Router 获取当前路径
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';
    
    // 提取资源路径部分，移除 /services/{serviceName}/resources/ 前缀
    const currentPath = this.extractResourcePathFromUrl(currentUrl);
    
    if (!currentPath) {
      console.warn('PathParamResolver: Could not extract resource path from current URL:', currentUrl);
      return pathParams;
    }
    
    // 将路径模式和当前路径都拆分成段
    const patternSegments = pathPattern.split('/').filter(Boolean);
    const currentSegments = currentPath.split('/').filter(Boolean);
    
    // 遍历路径模式，找到参数占位符并从当前路径中提取对应的值
    for (let i = 0; i < patternSegments.length && i < currentSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const currentSegment = currentSegments[i];
      
      // 如果是参数段（被{}包围）
      if (patternSegment.startsWith('{') && patternSegment.endsWith('}')) {
        const paramName = patternSegment.slice(1, -1); // 移除 {}，得到参数名
        pathParams[paramName] = currentSegment;
      }
      // 如果是静态段，验证是否匹配
      else if (patternSegment !== currentSegment) {
        console.warn(`PathParamResolver: Pattern segment "${patternSegment}" doesn't match current segment "${currentSegment}"`);
      }
    }
    
    console.log(`PathParamResolver.extractPathParams: currentUrl=${currentUrl}, currentPath=${currentPath}, pathPattern=${pathPattern}, pathParams=${JSON.stringify(pathParams)}`);
    
    return pathParams;
  }

  /**
   * 从完整URL中提取资源路径部分
   * @param fullUrl 完整URL，如 "/services/test/resources/authors/123/books/456"
   * @returns 资源路径部分，如 "/authors/123/books/456"
   */
  static extractResourcePathFromUrl(fullUrl: string): string {
    const segments = fullUrl.split('/').filter(Boolean);
    
    // 查找路由模式：services/{serviceName}/resources/
    const servicesIndex = segments.findIndex(segment => segment === 'services');
    if (servicesIndex === -1 || servicesIndex + 2 >= segments.length || segments[servicesIndex + 2] !== 'resources') {
      return '';
    }
    
    // 从 resources 后面开始的所有段就是资源路径
    const resourceSegments = segments.slice(servicesIndex + 3);
    
    return resourceSegments.length > 0 ? '/' + resourceSegments.join('/') : '';
  }

  /**
   * 基于路径模式和参数构建完整路径
   * @param pathPattern 路径模式，如 "/authors/{authorId}/books/{bookId}"
   * @param pathParams 路径参数对象，如 { authorId: "123", bookId: "456" }
   * @returns 构建的完整路径，如 "/authors/123/books/456"
   */
  static buildPath(pathPattern: string, pathParams: Record<string, string>): string {
    let result = pathPattern;
    
    // 替换路径模式中的所有参数占位符
    for (const [paramName, paramValue] of Object.entries(pathParams)) {
      const placeholder = `{${paramName}}`;
      result = result.replace(placeholder, encodeURIComponent(paramValue));
    }
    
    return result;
  }

  /**
   * 从路径模式中提取所有参数名
   * @param pathPattern 路径模式，如 "/authors/{authorId}/books/{bookId}"
   * @returns 参数名数组，如 ["authorId", "bookId"]
   */
  static extractParamNames(pathPattern: string): string[] {
    const paramNames: string[] = [];
    const segments = pathPattern.split('/').filter(Boolean);
    
    for (const segment of segments) {
      if (segment.startsWith('{') && segment.endsWith('}')) {
        const paramName = segment.slice(1, -1);
        paramNames.push(paramName);
      }
    }
    
    return paramNames;
  }
}
