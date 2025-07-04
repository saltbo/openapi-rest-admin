// Type definitions for openapi-rest-admin - Standalone Mode

// Standalone assets information
export interface StandaloneAssets {
  js: string;
  css: string;
}

export declare const standaloneAssets: StandaloneAssets;

export declare function getAssetUrl(baseUrl: string, filename: string): string;

// Runtime configuration interface
export interface RuntimeConfig {
  openapiDocUrl?: string;
  siteTitle?: string;
  basename?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcRedirectUri?: string;
  oidcResponseType?: string;
  oidcScope?: string;
  oidcAudience?: string;
  [key: string]: any;
}

// Admin interface creation function
export declare function createAdminInterface(
  selector: string, 
  config?: RuntimeConfig
): {
  unmount: () => void;
};

// Global namespace for script tag usage
declare global {
  interface Window {
    OpenAPIRestAdmin: {
      createAdminInterface: typeof createAdminInterface;
    };
  }
}

// Default export for ES modules
declare const _default: {
  createAdminInterface: typeof createAdminInterface;
};

export default _default;
