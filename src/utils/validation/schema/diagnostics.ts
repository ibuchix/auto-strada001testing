
/**
 * Schema validation diagnostics functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

import { rpcFunctionAvailableCache } from "./cache";

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost';
};

export const getSchemaValidationDiagnostics = (): Record<string, any> => {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }
  
  return {
    timestamp: new Date().toISOString(),
    rpcCacheStatus: { ...rpcFunctionAvailableCache },
    environment: process.env.NODE_ENV
  };
};
