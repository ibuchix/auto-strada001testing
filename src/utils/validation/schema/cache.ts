
/**
 * Schema validation caching functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

// Cache for RPC function availability
let rpcFunctionAvailableCache: Record<string, boolean> = {};

export const resetSchemaValidationCache = (tableName?: string): void => {
  if (process.env.NODE_ENV === 'production') return;
  
  if (tableName) {
    delete rpcFunctionAvailableCache[tableName];
  } else {
    rpcFunctionAvailableCache = {};
  }
};

export { rpcFunctionAvailableCache };
