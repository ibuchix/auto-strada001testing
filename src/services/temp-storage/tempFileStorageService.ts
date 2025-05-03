
/**
 * Temporary File Storage Service
 * Created: 2025-05-08
 * 
 * Service for managing temporary file uploads during form completion
 */

import { v4 as uuidv4 } from 'uuid';

// In-memory storage for temporary files
const tempFiles = new Map<string, {
  id: string;
  file: File;
  url: string;
  category: string;
  createdAt: Date;
}>();

// Temporary file storage service
export const tempFileStorageService = {
  // Upload a file to temporary storage
  async uploadFile(file: File, category: string = 'general') {
    const id = uuidv4();
    const url = URL.createObjectURL(file);
    
    const fileObj = {
      id,
      file,
      url,
      category,
      createdAt: new Date()
    };
    
    tempFiles.set(id, fileObj);
    return fileObj;
  },
  
  // Get a file from temporary storage
  getFile(id: string) {
    return tempFiles.get(id);
  },
  
  // Remove a file from temporary storage
  removeFile(id: string) {
    const file = tempFiles.get(id);
    if (file && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    return tempFiles.delete(id);
  },
  
  // Remove a file by name
  removeFileByName(name: string) {
    for (const [id, file] of tempFiles.entries()) {
      if (file.file.name === name) {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
        tempFiles.delete(id);
        return true;
      }
    }
    return false;
  },
  
  // Clear all files
  clearAll() {
    for (const file of tempFiles.values()) {
      if (file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    }
    tempFiles.clear();
  },
  
  // Get files by category
  getFilesByCategory(category: string) {
    const result = [];
    for (const file of tempFiles.values()) {
      if (file.category === category) {
        result.push(file);
      }
    }
    return result;
  },
  
  // Get remaining session time (mock)
  getRemainingSessionTime() {
    // Return a mock value of 30 minutes
    return 30;
  },
  
  // Add file (compatibility method for older implementations)
  async addFile(file: File, category: string = 'general') {
    return this.uploadFile(file, category);
  }
};

// Export a singleton instance
export const tempFileStorage = tempFileStorageService;
