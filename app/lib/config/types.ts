/**
 * Configuration runtime types
 */
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
}

/**
 * Configuration field metadata
 */
export interface ConfigFieldMeta {
  key: keyof RuntimeConfig;
  envKey: string;
  defaultValue: string | boolean;
  description: string;
  required: boolean;
}

export const CONFIG_FIELDS: ConfigFieldMeta[] = [
  {
    key: 'openapiDocUrl',
    envKey: 'VITE_OPENAPI_DOC_URL',
    defaultValue: '/openapi/apidocs.json',
    description: 'OpenAPI Doc URL',
    required: true,
  },
  {
    key: 'siteTitle',
    envKey: 'VITE_SITE_TITLE',
    defaultValue: 'OpenAPI Admin',
    description: 'Website title',
    required: false,
  },
  {
    key: 'basename',
    envKey: 'VITE_BASENAME',
    defaultValue: '/',
    description: 'Base URL for the application',
    required: false,
  },
  {
    key: 'oidcIssuer',
    envKey: 'VITE_OIDC_ISSUER',
    defaultValue: '',
    description: 'OIDC Identity Provider Issuer URL',
    required: false,
  },
  {
    key: 'oidcClientId',
    envKey: 'VITE_OIDC_CLIENT_ID',
    defaultValue: '',
    description: 'OIDC Client ID',
    required: false,
  },
  {
    key: 'oidcRedirectUri',
    envKey: 'VITE_OIDC_REDIRECT_URI',
    defaultValue: '/auth/callback',
    description: 'OIDC Redirect URI after login',
    required: false,
  },
  {
    key: 'oidcResponseType',
    envKey: 'VITE_OIDC_RESPONSE_TYPE',
    defaultValue: 'code',
    description: 'OIDC Response Type',
    required: false,
  },
  {
    key: 'oidcScope',
    envKey: 'VITE_OIDC_SCOPE',
    defaultValue: 'openid profile email',
    description: 'OIDC Scope',
    required: false,
  },
  {
    key: 'oidcAudience',
    envKey: 'VITE_OIDC_AUDIENCE',
    defaultValue: '',
    description: 'OIDC Audience',
    required: false,
  },
];
