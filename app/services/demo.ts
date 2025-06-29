/**
 * Demonstration of the refactored core services
 * 
 * This file shows how to use the new and improved OpenAPIParser and ResourceManager
 * with their enhanced features and better architecture.
 */

import { 
  OpenAPIParser, 
  openAPIParser, 
  resourceManager, 
  ResourceQuery,
  enhancedResourceManager 
} from '~/services';

/**
 * Example 1: Pure OpenAPI Parsing (no side effects)
 */
async function demonstratePureParser() {
  const sampleSpec = {
    openapi: '3.0.0',
    info: { title: 'Demo API', version: '1.0.0' },
    servers: [{ url: 'https://api.demo.com' }],
    paths: {
      '/users': {
        get: { summary: 'List users' },
        post: { summary: 'Create user' }
      },
      '/users/{id}/posts': {
        get: { summary: 'List user posts' }
      }
    }
  };

  // Pure parsing - no caching, no side effects
  const analysis = OpenAPIParser.parseSpec(sampleSpec);
  
  console.log('Pure Parser Results:');
  console.log(`- Title: ${analysis.title}`);
  console.log(`- Resources found: ${analysis.resources.length}`);
  console.log(`- Total operations: ${analysis.total_operations}`);
  
  return analysis;
}

/**
 * Example 2: Service-level parsing (with caching)
 */
async function demonstrateParserService() {
  // Service parsing - includes caching and business logic
  try {
    const analysis = await openAPIParser.parseOpenAPI(
      'demo-api', 
      'https://api.demo.com/openapi.json'
    );
    
    console.log('Service Parser Results:');
    console.log(`- Cached: ${openAPIParser.isCached('demo-api')}`);
    console.log(`- Resources: ${analysis.resources.length}`);
    
    return analysis;
  } catch (error) {
    console.log('Demo URL not accessible, using mock data');
    return demonstratePureParser();
  }
}

/**
 * Example 3: Enhanced Resource Management
 */
function demonstrateResourceManager(resources: any[]) {
  console.log('\n=== Resource Manager Demo ===');
  
  // Basic search with depth limiting
  const userResource = resourceManager.findByName(resources, 'users', {
    maxDepth: 5  // NEW: Prevent infinite recursion
  });
  
  console.log('Found user resource:', userResource?.name);
  
  // Enhanced hierarchy analysis
  const hierarchy = resourceManager.getResourceHierarchy(resources, 'posts');
  if (hierarchy) {
    console.log('Posts hierarchy:', {
      path: hierarchy.path,
      depth: hierarchy.depth,
      isTopLevel: hierarchy.isTopLevel,
      hasSubResources: hierarchy.hasSubResources
    });
  }
  
  // Enhanced statistics
  const stats = resourceManager.getStats(resources);
  console.log('Enhanced stats:', {
    total: stats.total,
    maxDepth: stats.maxDepth,  // NEW
    operationCounts: stats.operationCounts  // NEW
  });
  
  // Resource validation
  if (userResource) {
    const validation = resourceManager.validateResource(userResource);
    console.log('Validation result:', {
      isValid: validation.isValid,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      suggestions: validation.suggestions.length
    });
  }
}

/**
 * Example 4: Query Builder Pattern
 */
function demonstrateQueryBuilder(resources: any[]) {
  console.log('\n=== Query Builder Demo ===');
  
  // Fluent query interface
  const restfulPosts = new ResourceQuery(resources)
    .byName(/posts?/)
    .withOperation('POST')
    .isRESTful(true)
    .sortByName()
    .limit(5)
    .execute();
  
  console.log(`Found ${restfulPosts.length} RESTful post resources`);
  
  // Check existence without executing full query
  const hasAdminResources = new ResourceQuery(resources)
    .withTag('admin')
    .exists();
  
  console.log('Has admin resources:', hasAdminResources);
  
  // Count resources with specific operations
  const getResourceCount = new ResourceQuery(resources)
    .withOperation('GET')
    .count();
  
  console.log(`Resources with GET operation: ${getResourceCount}`);
  
  // Complex chained query
  const complexResults = new ResourceQuery(resources)
    .withOperation('POST')
    .isRESTful(true)
    .hasSubResources(false)  // Only leaf resources
    .sortByName()
    .execute();
  
  console.log(`Complex query results: ${complexResults.length} resources`);
}

/**
 * Example 5: Enhanced Manager Features
 */
function demonstrateEnhancedManager(resources: any[]) {
  console.log('\n=== Enhanced Manager Demo ===');
  
  // Get suggestions for partial input
  const suggestions = enhancedResourceManager.getSuggestions(resources, 'us', 3);
  console.log('Suggestions for "us":', suggestions.map(r => r.name));
  
  // Analyze resource relationships
  const relationships = enhancedResourceManager.analyzeRelationships(resources);
  console.log('Relationship analysis:', {
    totalRelationships: Object.keys(relationships.relationships).length,
    orphanedResources: relationships.orphanedResources.length
  });
  
  // Advanced filtering
  const postResources = enhancedResourceManager.findResources(
    resources,
    resource => resource.name.includes('post'),
    { includeSubResources: true }
  );
  
  console.log(`Found ${postResources.length} post-related resources`);
}

/**
 * Example 6: Error Handling and Edge Cases
 */
function demonstrateErrorHandling(resources: any[]) {
  console.log('\n=== Error Handling Demo ===');
  
  // Graceful handling of invalid inputs
  console.log('Empty search:', resourceManager.findByName([], 'test')); // null
  console.log('Empty name:', resourceManager.findByName(resources, '')); // null
  console.log('Invalid path:', resourceManager.findByPath(resources, '')); // null
  
  // Depth limiting prevents infinite recursion
  const deepSearch = resourceManager.findByName(resources, 'deeply-nested', {
    maxDepth: 2  // Will stop searching after depth 2
  });
  console.log('Deep search with limit:', deepSearch);
  
  // Query builder with no results
  const noResults = new ResourceQuery(resources)
    .byName('nonexistent')
    .execute();
  console.log('No results query:', noResults.length); // 0
}

/**
 * Main demonstration function
 */
export async function runServicesDemonstration() {
  console.log('🚀 Core Services Refactoring Demonstration\n');
  
  try {
    // Parse OpenAPI document
    const analysis = await demonstrateParserService();
    const resources = analysis.resources;
    
    // Demonstrate each feature
    demonstrateResourceManager(resources);
    demonstrateQueryBuilder(resources);
    demonstrateEnhancedManager(resources);
    demonstrateErrorHandling(resources);
    
    console.log('\n✅ Demonstration completed successfully!');
    console.log('\nKey improvements:');
    console.log('- Enhanced error handling and input validation');
    console.log('- Depth limiting to prevent infinite recursion');
    console.log('- Query builder pattern for complex searches');
    console.log('- Resource validation and analysis');
    console.log('- Better separation of pure parsing vs business logic');
    console.log('- Comprehensive statistics and relationship analysis');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
}

// Example usage in a React component or service
export function useRefactoredServices() {
  return {
    // Pure parsing (no side effects)
    parseOpenAPISpec: OpenAPIParser.parseSpec,
    
    // Service layer (with caching)
    parseOpenAPIDocument: openAPIParser.parseOpenAPI,
    
    // Basic resource management
    findResource: resourceManager.findByName,
    findByPath: resourceManager.findByPath,
    getStats: resourceManager.getStats,
    
    // Advanced querying
    queryResources: (resources: any[]) => new ResourceQuery(resources),
    
    // Enhanced features
    getSuggestions: enhancedResourceManager.getSuggestions,
    analyzeRelationships: enhancedResourceManager.analyzeRelationships,
  };
}
