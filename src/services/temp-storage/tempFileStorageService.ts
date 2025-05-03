
/**
 * Temporary File Storage Service
 * Created: 2025-07-26
 * 
 * Service to handle temporary file storage during form completion
 */

class TempFileStorageService {
  private sessionStartTime: Date;
  private sessionTimeout: number = 60; // 60 minutes
  
  constructor() {
    this.sessionStartTime = new Date();
  }
  
  /**
   * Get remaining session time in minutes
   */
  getRemainingSessionTime(): number {
    const currentTime = new Date();
    const elapsedMinutes = (currentTime.getTime() - this.sessionStartTime.getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(0, this.sessionTimeout - elapsedMinutes);
    return Math.floor(remainingMinutes);
  }
  
  /**
   * Reset session timer
   */
  resetSessionTimer(): void {
    this.sessionStartTime = new Date();
  }
  
  /**
   * Store a temporary file
   */
  storeFile(key: string, data: any): void {
    try {
      sessionStorage.setItem(`temp_file_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to store temporary file:", error);
    }
  }
  
  /**
   * Retrieve a temporary file
   */
  getFile(key: string): any {
    try {
      const data = sessionStorage.getItem(`temp_file_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to retrieve temporary file:", error);
      return null;
    }
  }
  
  /**
   * Clear a specific temporary file
   */
  clearFile(key: string): void {
    try {
      sessionStorage.removeItem(`temp_file_${key}`);
    } catch (error) {
      console.error("Failed to clear temporary file:", error);
    }
  }
  
  /**
   * Clear all temporary files
   */
  clearAll(): void {
    try {
      // Get all keys in sessionStorage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('temp_file_')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all temporary files
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log(`Cleared ${keysToRemove.length} temporary files`);
    } catch (error) {
      console.error("Failed to clear all temporary files:", error);
    }
  }
}

export const tempFileStorage = new TempFileStorageService();
