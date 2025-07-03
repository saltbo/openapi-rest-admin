/**
 * Configuration runtime types
 */
export interface RuntimeConfig {
  openapiDocUrl: string;
  appTitle?: string;
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
    key: 'appTitle',
    envKey: 'VITE_APP_TITLE',
    defaultValue: 'OpenAPI Admin',
    description: 'Application title',
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
