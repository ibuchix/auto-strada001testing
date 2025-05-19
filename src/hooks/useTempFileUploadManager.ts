
/**
 * Global Temporary File Upload Manager
 * Created: 2025-05-19
 * 
 * This hook provides a global upload manager that can be used to track and manage
 * temporary file uploads across the application. It registers with a global object
 * that other components can access.
 */

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the interface for the global file upload manager
interface TempFileUploadManager {
  registerUpload: (id: string, file: File) => void;
  registerCompletion: (id: string) => void;
  registerFailure: (id: string) => void;
  pendingFileCount: () => number;
  pendingFiles: () => Record<string, File>;
  clearAll: () => void;
  stats: () => {
    pending: number;
    completed: number;
    failed: number;
    total: number;
  };
}

// Create the global upload manager
const createUploadManager = (): TempFileUploadManager => {
  // Track uploads by ID
  const pendingUploads = new Map<string, File>();
  const completedUploads = new Set<string>();
  const failedUploads = new Set<string>();
  
  // Register a new upload
  const registerUpload = (id: string, file: File) => {
    console.log(`[TempFileUploadManager] Registering upload: ${id}, file: ${file.name}`);
    pendingUploads.set(id, file);
  };
  
  // Mark an upload as completed
  const registerCompletion = (id: string) => {
    if (pendingUploads.has(id)) {
      console.log(`[TempFileUploadManager] Marked complete: ${id}`);
      pendingUploads.delete(id);
      completedUploads.add(id);
    }
  };
  
  // Mark an upload as failed
  const registerFailure = (id: string) => {
    if (pendingUploads.has(id)) {
      console.log(`[TempFileUploadManager] Marked failed: ${id}`);
      const filename = pendingUploads.get(id)?.name || 'unknown';
      pendingUploads.delete(id);
      failedUploads.add(id);
    }
  };
  
  // Get the number of pending uploads
  const pendingFileCount = () => {
    return pendingUploads.size;
  };
  
  // Get the currently pending files
  const pendingFiles = () => {
    const files: Record<string, File> = {};
    pendingUploads.forEach((file, id) => {
      files[id] = file;
    });
    return files;
  };
  
  // Clear all uploads
  const clearAll = () => {
    console.log(`[TempFileUploadManager] Clearing all uploads`);
    pendingUploads.clear();
    completedUploads.clear();
    failedUploads.clear();
  };
  
  // Get statistics
  const stats = () => {
    return {
      pending: pendingUploads.size,
      completed: completedUploads.size,
      failed: failedUploads.size,
      total: pendingUploads.size + completedUploads.size + failedUploads.size
    };
  };
  
  return {
    registerUpload,
    registerCompletion,
    registerFailure,
    pendingFileCount,
    pendingFiles,
    clearAll,
    stats
  };
};

/**
 * Hook to create and register a file upload manager globally
 */
export const useTempFileUploadManager = () => {
  const idRef = useRef<string>(uuidv4());
  
  // Initialize on first render
  useEffect(() => {
    // Initialize global manager if it doesn't exist
    if (typeof window !== 'undefined') {
      if (!(window as any).__tempFileUploadManager) {
        console.log('[TempFileUploadManager] Initializing global upload manager');
        (window as any).__tempFileUploadManager = createUploadManager();
      }
    }
    
    // Clean up on unmount
    return () => {
      // Optional: Clean up any resources if component unmounts
    };
  }, []);
  
  // Get the global manager
  const getManager = (): TempFileUploadManager | null => {
    if (typeof window !== 'undefined') {
      return (window as any).__tempFileUploadManager || null;
    }
    return null;
  };
  
  // Register a file upload
  const registerUpload = (file: File): string => {
    const uploadId = `${idRef.current}-${uuidv4()}`;
    const manager = getManager();
    
    if (manager) {
      manager.registerUpload(uploadId, file);
    } else {
      console.error('[TempFileUploadManager] Manager not available');
    }
    
    return uploadId;
  };
  
  // Mark an upload as complete
  const registerCompletion = (uploadId: string) => {
    const manager = getManager();
    
    if (manager) {
      manager.registerCompletion(uploadId);
    }
  };
  
  // Mark an upload as failed
  const registerFailure = (uploadId: string) => {
    const manager = getManager();
    
    if (manager) {
      manager.registerFailure(uploadId);
    }
  };
  
  // Get pending file count
  const getPendingCount = (): number => {
    const manager = getManager();
    return manager ? manager.pendingFileCount() : 0;
  };
  
  // Verify all uploads are complete
  const verifyAllUploadsComplete = (): boolean => {
    const manager = getManager();
    return manager ? manager.pendingFileCount() === 0 : true;
  };
  
  // Clear all uploads
  const clearAllUploads = () => {
    const manager = getManager();
    if (manager) {
      manager.clearAll();
    }
  };
  
  // Get upload stats
  const getStats = () => {
    const manager = getManager();
    return manager ? manager.stats() : { pending: 0, completed: 0, failed: 0, total: 0 };
  };
  
  return {
    registerUpload,
    registerCompletion,
    registerFailure,
    getPendingCount,
    verifyAllUploadsComplete,
    clearAllUploads,
    getStats
  };
};

// Export the hook
export default useTempFileUploadManager;
