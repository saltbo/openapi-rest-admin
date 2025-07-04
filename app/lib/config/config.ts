import type { RuntimeConfig } from "./types";

export const createDefaultConfig = (): RuntimeConfig => {
  return {
    openapiDocUrl:
      import.meta.env.VITE_OPENAPI_DOC_URL || "/openapi/apidocs.json",
    siteTitle: import.meta.env.VITE_SITE_TITLE || "OpenAPI Admin",
    basename: import.meta.env.BASENAME || "/",
    oidcIssuer: import.meta.env.VITE_OIDC_ISSUER || "",
    oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
    oidcRedirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI || "",
    oidcResponseType: import.meta.env.VITE_OIDC_RESPONSE_TYPE || "code",
    oidcScope: import.meta.env.VITE_OIDC_SCOPE || "openid profile email",
    oidcAudience: import.meta.env.VITE_OIDC_AUDIENCE || "",
  };
};
