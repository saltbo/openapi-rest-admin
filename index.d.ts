// Type definitions for openapi-rest-admin

export declare const assetsPath: string;

export declare function getAssetUrl(filename: string): string;

export interface OpenAPIRestAdminAssets {
  js: string[];
  css: string[];
}

export declare const assets: OpenAPIRestAdminAssets;

// Runtime configuration interface
export interface RuntimeConfig {
  openapiDocUrl?: string;
  siteTitle?: string;
  basename?: string;
  auth?: {
    enabled?: boolean;
    type?: 'oauth2' | 'basic' | 'apikey';
    [key: string]: any;
  };
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
