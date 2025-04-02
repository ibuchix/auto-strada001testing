
/**
 * API hooks exports
 * 
 * Changes made:
 * - 2025-11-22: Created index file to simplify imports
 */

// Main API request hook
export { useApiRequest } from './useApiRequest';
export type { UseApiCoreOptions } from './useApiCore';

// Individual method hooks for more targeted usage
export { 
  useGetRequest,
  usePostRequest,
  usePutRequest,
  useDeleteRequest,
  useInvokeFunctionRequest
} from './useHttpMethods';

// Core functionality for advanced customization
export { useApiCore } from './useApiCore';
