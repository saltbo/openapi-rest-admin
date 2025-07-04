import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import type { RuntimeConfig } from "./lib/config/types";

// Global namespace for the library
declare global {
  interface Window {
    OpenAPIRestAdmin: {
      createAdminInterface: (selector: string, config?: RuntimeConfig) => {
        unmount: () => void;
      };
    };
  }
}

// Create the admin interface function
function createAdminInterface(selector: string, config?: RuntimeConfig) {
  const container = document.querySelector(selector);
  
  if (!container) {
    throw new Error(`Container element "${selector}" not found`);
  }

  // Clear existing content
  container.innerHTML = '';
  
  // Create a div for the React app
  const appDiv = document.createElement('div');
  appDiv.id = 'openapi-rest-admin-root';
  appDiv.style.width = '100%';
  appDiv.style.height = '100%';
  container.appendChild(appDiv);

  // Render the React app
  const root = ReactDOM.createRoot(appDiv);
  root.render(
    <React.StrictMode>
      <App {...config} />
    </React.StrictMode>
  );

  return {
    unmount: () => {
      root.unmount();
      container.removeChild(appDiv);
    }
  };
}

// Expose to global object immediately
const globalAPI = {
  createAdminInterface,
};

// For UMD builds, expose on window
if (typeof window !== 'undefined') {
  window.OpenAPIRestAdmin = globalAPI;
}

// For CommonJS
if (typeof module !== 'undefined' && (module as any).exports) {
  (module as any).exports = globalAPI;
}

// For AMD
if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
  (window as any).define([], () => globalAPI);
}

// Also support ES module usage
export { createAdminInterface };
export default globalAPI;
