/**
 * 路径参数解析器
 * 用于处理 OpenAPI 路径模式和实际路径之间的参数提取和构建
 */
export class PathParamResolver {
  /**
   * 从当前网页地址中解析出路径参数
   * @param pathPattern 路径模式，如 "/authors/{authorId}/books/{bookId}"
   * @returns 解析出的路径参数对象，如 { authorId: "123", bookId: "456" }
   */
  static extractPathParams(pathname: string, pathPattern: string): Record<string, string> {
    const pathParams: Record<string, string> = {};
    
    // 使用 React Router 获取当前路径
    if (!pathname) {
      console.warn('PathParamResolver: Could not extract resource path from current URL:', pathname);
      return pathParams;
    }
    
    // 将路径模式和当前路径都拆分成段
    const patternSegments = pathPattern.split('/').filter(Boolean);
    const currentSegments = pathname.split('/').filter(Boolean);
    
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
    
    console.log(`PathParamResolver.extractPathParams: currentPath=${pathname}, pathPattern=${pathPattern}, pathParams=${JSON.stringify(pathParams)}`);
    
    return pathParams;
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
}
