# OpenAPI REST Admin - Standalone Usage

This document explains how to use OpenAPI REST Admin as a standalone library, similar to how you would use Scalar API Reference.

## Building the Standalone Version

First, build the standalone version of the library:

```bash
npm run build:standalone
```

This will generate two files in the `dist/assets/` directory:
- `openapi-rest-admin.js` - The JavaScript bundle
- `openapi-rest-admin.css` - The CSS styles

## Usage

### Method 1: Script Tag (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My API Admin</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- Load the CSS -->
    <link rel="stylesheet" href="path/to/openapi-rest-admin.css">
</head>
<body>
    <div id="app"></div>

    <!-- Load the JavaScript -->
    <script src="path/to/openapi-rest-admin.js"></script>

    <!-- Initialize the admin interface -->
    <script>
        OpenAPIRestAdmin.createAdminInterface('#app', {
            // The URL of your OpenAPI/Swagger document
            openapiDocUrl: 'https://api.example.com/openapi.json',
            
            // Optional: Custom site title
            siteTitle: 'My API Admin',
            
            // Optional: Base path for routing
            basename: '/admin',
            
            // Optional: OIDC configuration
            oidcIssuer: 'https://auth.example.com',
            oidcClientId: 'your-client-id',
            oidcRedirectUri: 'https://yourdomain.com/admin/auth/callback'
        });
    </script>
</body>
</html>
```

### Method 2: ES Modules

If you're using a bundler, you can import the library as an ES module:

```javascript
import { createAdminInterface } from 'openapi-rest-admin/dist/assets/openapi-rest-admin.js';

const adminInterface = createAdminInterface('#app', {
    openapiDocUrl: 'https://api.example.com/openapi.json',
    siteTitle: 'My API Admin'
});

// Later, if you need to unmount:
// adminInterface.unmount();
```

## Configuration Options

The `createAdminInterface` function accepts the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `openapiDocUrl` | `string` | URL to your OpenAPI/Swagger JSON document | `/openapi/apidocs.json` |
| `siteTitle` | `string` | Custom title for the admin interface | `'OpenAPI Admin'` |
| `basename` | `string` | Base path for routing (useful if hosted under a subpath) | `'/'` |
| `oidcIssuer` | `string` | OIDC issuer URL for authentication | - |
| `oidcClientId` | `string` | OIDC client ID | - |
| `oidcRedirectUri` | `string` | OIDC redirect URI | - |
| `oidcResponseType` | `string` | OIDC response type | - |
| `oidcScope` | `string` | OIDC scope | - |
| `oidcAudience` | `string` | OIDC audience | - |

## Examples

### Basic Usage

```html
<script>
OpenAPIRestAdmin.createAdminInterface('#app', {
    openapiDocUrl: 'https://petstore3.swagger.io/api/v3/openapi.json'
});
</script>
```

### With Authentication

```html
<script>
OpenAPIRestAdmin.createAdminInterface('#app', {
    openapiDocUrl: 'https://api.example.com/openapi.json',
    siteTitle: 'Internal API Admin',
    oidcIssuer: 'https://auth0.example.com',
    oidcClientId: 'your-auth0-client-id',
    oidcRedirectUri: window.location.origin + '/auth/callback'
});
</script>
```

### With Custom Base Path

```html
<script>
OpenAPIRestAdmin.createAdminInterface('#app', {
    openapiDocUrl: '/api/openapi.json',
    basename: '/admin',
    siteTitle: 'API Management Console'
});
</script>
```

## Return Value

The `createAdminInterface` function returns an object with the following methods:

- `unmount()`: Unmounts the React component and cleans up

```javascript
const adminInterface = OpenAPIRestAdmin.createAdminInterface('#app', config);

// Later, to clean up:
adminInterface.unmount();
```

## TypeScript Support

If you're using TypeScript, you can import the types:

```typescript
import type { RuntimeConfig } from 'openapi-rest-admin';

const config: RuntimeConfig = {
    openapiDocUrl: 'https://api.example.com/openapi.json',
    siteTitle: 'My API Admin'
};

OpenAPIRestAdmin.createAdminInterface('#app', config);
```

## CDN Usage

You can also host the built files on a CDN and reference them directly:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/openapi-rest-admin@latest/dist/assets/openapi-rest-admin.css">
<script src="https://cdn.jsdelivr.net/npm/openapi-rest-admin@latest/dist/assets/openapi-rest-admin.js"></script>
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues when loading your OpenAPI document, make sure your API server includes the appropriate CORS headers, or consider using a proxy.

### Container Not Found

If you get an error about the container element not being found, make sure:
1. The DOM element exists before calling `createAdminInterface`
2. The selector is correct (e.g., `#app` for an element with `id="app"`)

### Authentication Redirect

When using OIDC authentication, make sure the `oidcRedirectUri` matches the URL where your admin interface is hosted, with the appropriate callback path.
