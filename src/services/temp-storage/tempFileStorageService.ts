
/**
 * Temporary File Storage Service
 * Created: 2025-07-24
 * 
 * Handles temporary storage of file data during form submissions
 */

type StoredFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 or URL
  timestamp: number;
};

class TempFileStorageService {
  private sessionStartTime: number;
  private sessionDuration: number = 3600000; // 1 hour in milliseconds
  private storagePrefix = 'temp_file_';
  
  constructor() {
    this.sessionStartTime = Date.now();
  }
  
  /**
   * Store a file temporarily
   */
  storeFile(fileId: string, fileData: StoredFile): void {
    const key = `${this.storagePrefix}${fileId}`;
    localStorage.setItem(key, JSON.stringify(fileData));
  }
  
  /**
   * Get a stored file
   */
  getFile(fileId: string): StoredFile | null {
    const key = `${this.storagePrefix}${fileId}`;
    const fileData = localStorage.getItem(key);
    
    if (!fileData) return null;
    
    try {
      return JSON.parse(fileData) as StoredFile;
    } catch (e) {
      console.error('Failed to parse file data', e);
      return null;
    }
  }
  
  /**
   * Remove a stored file
   */
  removeFile(fileId: string): void {
    const key = `${this.storagePrefix}${fileId}`;
    localStorage.removeItem(key);
  }
  
  /**
   * Clear all stored files
   */
  clearAll(): void {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Filter for temp file keys
    const fileKeys = keys.filter(key => key.startsWith(this.storagePrefix));
    
    // Remove all found keys
    fileKeys.forEach(key => localStorage.removeItem(key));
  }
  
  /**
   * Get remaining session time in minutes
   */
  getRemainingSessionTime(): number {
    const elapsed = Date.now() - this.sessionStartTime;
    const remaining = this.sessionDuration - elapsed;
    
    // Convert to minutes and round down
    return Math.floor(Math.max(0, remaining) / 60000);
  }
  
  /**
   * Reset the session timer
   */
  resetSession(): void {
    this.sessionStartTime = Date.now();
  }
  
  /**
   * Extend the session by a specified amount of time (in minutes)
   */
  extendSession(minutes: number): void {
    this.sessionDuration += minutes * 60000;
  }
  
  /**
   * Get all stored files
   */
  getAllFiles(): StoredFile[] {
    const keys = Object.keys(localStorage);
    const fileKeys = keys.filter(key => key.startsWith(this.storagePrefix));
    
    return fileKeys
      .map(key => {
        try {
          const fileData = localStorage.getItem(key);
          return fileData ? JSON.parse(fileData) as StoredFile : null;
        } catch (e) {
          return null;
        }
      })
      .filter((file): file is StoredFile => file !== null);
  }
}

export const tempFileStorage = new TempFileStorageService();
