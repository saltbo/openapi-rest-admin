import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { RuntimeConfig } from './types';

interface ConfigContextType {
  config: RuntimeConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  config: RuntimeConfig;
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ config, children }) => {
  return (
    <ConfigContext.Provider value={{ config }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = (): RuntimeConfig => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider');
  }
  return context.config;
};

// 便利的钩子函数，用于获取特定的配置值
export const useAppConfigValue = <K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] => {
  const config = useAppConfig();
  return config[key];
};
