// Entry point for the npm package - Standalone Mode
// This package is designed to be used as a standalone library via script tags
// The built files are in dist/assets/ after running `npm run build:standalone`

// For standalone usage, users should include these files:
export const standaloneAssets = {
    js: './dist/assets/openapi-rest-admin.js',
    css: './dist/assets/openapi-rest-admin.css'
};

// Helper function to get asset URLs for CDN usage
export function getAssetUrl(baseUrl, filename) {
    return `${baseUrl.replace(/\/$/, '')}/${filename}`;
}

// Re-export the standalone interface for programmatic usage
// Note: This requires the standalone build to be available
export { createAdminInterface } from './dist/assets/openapi-rest-admin.js';
/*
Standalone Usage (Recommended):
1. Build: npm run build:standalone
2. Include in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./node_modules/openapi-rest-admin/dist/assets/openapi-rest-admin.css">
</head>
<body>
    <div id="app"></div>
    <script src="./node_modules/openapi-rest-admin/dist/assets/openapi-rest-admin.js"></script>
    <script>
        OpenAPIRestAdmin.createAdminInterface('#app', {
            openapiDocUrl: 'https://api.example.com/openapi.json',
            siteTitle: 'My API Admin'
        });
    </script>
</body>
</html>
```

CDN Usage:
```html
<link rel="stylesheet" href="https://unpkg.com/openapi-rest-admin@latest/dist/assets/openapi-rest-admin.css">
<script src="https://unpkg.com/openapi-rest-admin@latest/dist/assets/openapi-rest-admin.js"></script>
```

Programmatic Usage:
```javascript
import { createAdminInterface } from 'openapi-rest-admin';
const admin = createAdminInterface('#app', config);
```
*/
