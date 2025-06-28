/**
 * OpenAPI 文档配置
 * 在这里定义你想要生成管理后台的 OpenAPI 文档
 */

export interface APIConfigItem {
  id: string;
  name: string;
  description: string;
  openapi_url: string;
  enabled: boolean;
  tags?: string[];
  version?: string;
}

export const API_CONFIGS: APIConfigItem[] = [
  {
    id: 'multi-resources',
    name: 'Multi Resources API',
    description: 'This is a sample server Petstore server. You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).',
    openapi_url: 'http://localhost:5173/multi-resources-api.json',
    enabled: true,
    tags: ['demo', 'pets'],
    version: '1.0.6'
  },{
    id: 'single-resource',
    name: 'Single Resource API',
    description: 'This is a sample server Petstore server. You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).',
    openapi_url: 'http://localhost:5173/single-resource-api.json',
    enabled: true,
    tags: ['demo', 'pets'],
    version: '1.0.6'
  },
];

export const getAPIConfig = (id: string): APIConfigItem | undefined => {
  return API_CONFIGS.find(config => config.id === id);
};

export const getEnabledAPIConfigs = (): APIConfigItem[] => {
  return API_CONFIGS.filter(config => config.enabled);
};
