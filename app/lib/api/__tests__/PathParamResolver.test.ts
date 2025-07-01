import { PathParamResolver } from '../PathParamResolver';

// Mock window.location for testing
const mockLocation = {
  pathname: '/services/test/resources/authors/123/books/456'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('PathParamResolver', () => {
  describe('extractPathParams', () => {
    beforeEach(() => {
      // Reset mock location before each test
      mockLocation.pathname = '/services/test/resources/authors/123/books/456';
    });

    it('should extract parameters from current URL', () => {
      const pathPattern = '/authors/{authorId}/books/{bookId}';
      const result = PathParamResolver.extractPathParams(pathPattern);
      
      expect(result).toEqual({ authorId: '123', bookId: '456' });
    });

    it('should handle single parameter', () => {
      mockLocation.pathname = '/services/test/resources/authors/123';
      const pathPattern = '/authors/{authorId}';
      const result = PathParamResolver.extractPathParams(pathPattern);
      
      expect(result).toEqual({ authorId: '123' });
    });

    it('should handle UUID parameters', () => {
      mockLocation.pathname = '/services/test/resources/authors/70fd8728-4528-44e9-a304-4af8361bf53f';
      const pathPattern = '/authors/{id}';
      const result = PathParamResolver.extractPathParams(pathPattern);
      
      expect(result).toEqual({ id: '70fd8728-4528-44e9-a304-4af8361bf53f' });
    });

    it('should return empty object if URL format is invalid', () => {
      mockLocation.pathname = '/invalid/path';
      const pathPattern = '/authors/{authorId}';
      const result = PathParamResolver.extractPathParams(pathPattern);
      
      expect(result).toEqual({});
    });
  });

  describe('buildPath', () => {
    it('should build path with single parameter', () => {
      const pathPattern = '/authors/{authorId}';
      const pathParams = { authorId: '123' };
      const result = PathParamResolver.buildPath(pathPattern, pathParams);
      
      expect(result).toBe('/authors/123');
    });

    it('should build path with multiple parameters', () => {
      const pathPattern = '/authors/{authorId}/books/{bookId}';
      const pathParams = { authorId: '123', bookId: '456' };
      const result = PathParamResolver.buildPath(pathPattern, pathParams);
      
      expect(result).toBe('/authors/123/books/456');
    });

    it('should URL encode parameters', () => {
      const pathPattern = '/authors/{name}';
      const pathParams = { name: 'John Doe' };
      const result = PathParamResolver.buildPath(pathPattern, pathParams);
      
      expect(result).toBe('/authors/John%20Doe');
    });
  });

  describe('extractParamNames', () => {
    it('should extract parameter names from pattern', () => {
      const pathPattern = '/authors/{authorId}/books/{bookId}';
      const result = PathParamResolver.extractParamNames(pathPattern);
      
      expect(result).toEqual(['authorId', 'bookId']);
    });

    it('should return empty array for pattern without parameters', () => {
      const pathPattern = '/authors/books';
      const result = PathParamResolver.extractParamNames(pathPattern);
      
      expect(result).toEqual([]);
    });
  });
});
