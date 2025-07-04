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

// Usage instructions in comments
/*
Usage:
1. Install: npm install openapi-rest-admin
2. Import the built assets in your project:
   - Copy files from node_modules/openapi-rest-admin/dist/assets/
   - Or use a bundler to include them
3. Include the CSS and JS files in your HTML

Example:
```html
<link rel="stylesheet" href="path/to/openapi-rest-admin/assets/index.css">
<script src="path/to/openapi-rest-admin/assets/index.js"></script>
```
*/
