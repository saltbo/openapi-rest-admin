// Entry point for the npm package - Standalone Mode
// This package is designed to be used as a standalone library via script tags

// For standalone usage, users should include these files:
export const standaloneAssets = {
    js: './dist/assets/openapi-rest-admin.js',
    css: './dist/assets/openapi-rest-admin.css'
} as const;

// Helper function to get asset URLs for CDN usage
export function getAssetUrl(baseUrl: string, filename: string): string {
    return `${baseUrl.replace(/\/$/, '')}/${filename}`;
}

// Re-export the standalone interface for programmatic usage
// Note: This is available after building the standalone version
export interface CreateAdminInterface {
    (selector: string, config?: RuntimeConfig): {
        unmount: () => void;
    };
}

// This will be available after building
declare const createAdminInterface: CreateAdminInterface;
export { createAdminInterface };

// For TypeScript users
export interface StandaloneAssets {
    js: string;
    css: string;
}

// Runtime configuration interface (re-exported from the main app)
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

// Usage instructions in comments
/*
Usage Method 1 - CDN/Script Tag:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My API Admin</title>
  <link rel="stylesheet" href="path/to/openapi-rest-admin.css">
</head>
<body>
  <div id="app"></div>
  <script src="path/to/openapi-rest-admin.js"></script>
  <script>
    OpenAPIRestAdmin.createAdminInterface('#app', {
      openapiDocUrl: 'https://api.example.com/openapi.json',
      siteTitle: 'My API Admin',
      basename: '/admin'
    });
  </script>
</body>
</html>
```

Usage Method 2 - NPM Package:
```javascript
import { createAdminInterface } from 'openapi-rest-admin';

createAdminInterface('#app', {
  openapiDocUrl: 'https://api.example.com/openapi.json',
  siteTitle: 'My API Admin'
});
```
*/
