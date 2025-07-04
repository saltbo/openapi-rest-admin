// Entry point for the npm package
// This file exports the built assets for consumption

// Note: The actual built JS and CSS files are in dist/assets/
// Users should import these files directly in their projects

export const assetsPath = './assets/';

// Helper function to get asset URLs
export function getAssetUrl(filename: string): string {
  return `${assetsPath}${filename}`;
}

// Export asset information
export const assets = {
  js: [
    // These will be populated after build
    // Users can check dist/assets/ for actual filenames
  ],
  css: [
    // These will be populated after build  
    // Users can check dist/assets/ for actual filenames
  ]
};

// For TypeScript users
export interface OpenAPIRestAdminAssets {
  js: string[];
  css: string[];
}

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
