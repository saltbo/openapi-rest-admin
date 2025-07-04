// Type definitions for openapi-rest-admin

export declare const assetsPath: string;

export declare function getAssetUrl(filename: string): string;

export interface OpenAPIRestAdminAssets {
  js: string[];
  css: string[];
}

export declare const assets: OpenAPIRestAdminAssets;
