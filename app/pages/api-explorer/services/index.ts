/**
 * API Explorer Services
 * 
 * These services are specific to the API Explorer functionality.
 * Core services like OpenAPI parsing and resource management are now in ~/services
 */

// Legacy exports for backward compatibility
export { openAPIParser } from '~/services';

// Frontend API client
export { frontendAPIService } from './api-client';
