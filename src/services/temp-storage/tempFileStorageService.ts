
/**
 * Temporary File Storage Service
 * Created: 2025-06-17
 * 
 * Service for managing temporary file uploads during form completion
 */

import { v4 as uuidv4 } from 'uuid';

export interface TempStoredFile {
  id: string;
  file: File;
  category: string;
  url: string;
  createdAt: Date;
}

// Session timeout in minutes
const SESSION_TIMEOUT = 60;

class TempFileStorageService {
  private files: Map<string, TempStoredFile>;
  private sessionStartTime: Date;
  private sessionTimeout: number;
  
  constructor(sessionTimeoutMinutes: number = SESSION_TIMEOUT) {
    this.files = new Map();
    this.sessionStartTime = new Date();
    this.sessionTimeout = sessionTimeoutMinutes;
  }
  
  /**
   * Add a file to temporary storage
   */
  public addFile(file: File, category: string = 'general'): Promise<TempStoredFile> {
    return new Promise((resolve, reject) => {
      try {
        // Create URL for the file
        const url = URL.createObjectURL(file);
        
        // Generate unique ID
        const id = `${category}-${uuidv4()}`;
        
        // Store file
        const storedFile: TempStoredFile = {
          id,
          file,
          category,
          url,
          createdAt: new Date()
        };
        
        this.files.set(id, storedFile);
        console.log(`TempFileStorage: Added file ${id} (${file.name}, ${file.size} bytes) to category ${category}`);
        
        resolve(storedFile);
      } catch (error) {
        console.error('TempFileStorage: Error adding file', error);
        reject(error);
      }
    });
  }
  
  /**
   * Get a file by ID
   */
  public getFile(id: string): TempStoredFile | undefined {
    return this.files.get(id);
  }
  
  /**
   * Remove a file by ID
   */
  public removeFile(id: string): boolean {
    if (this.files.has(id)) {
      const file = this.files.get(id);
      if (file && file.url) {
        URL.revokeObjectURL(file.url);
      }
      
      this.files.delete(id);
      return true;
    }
    
    return false;
  }
  
  /**
   * Remove a file by name
   */
  public removeFileByName(fileName: string): boolean {
    for (const [id, file] of this.files.entries()) {
      if (file.file.name === fileName) {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
        this.files.delete(id);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all files by category
   */
  public getFilesByCategory(category: string): TempStoredFile[] {
    const result: TempStoredFile[] = [];
    
    for (const file of this.files.values()) {
      if (file.category === category) {
        result.push(file);
      }
    }
    
    return result;
  }
  
  /**
   * Get all stored files
   */
  public getAllFiles(): TempStoredFile[] {
    return Array.from(this.files.values());
  }
  
  /**
   * Clear all files
   */
  public clearAll(): void {
    for (const file of this.files.values()) {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    }
    
    this.files.clear();
  }
  
  /**
   * Check if session has expired
   */
  public isSessionExpired(): boolean {
    const now = new Date();
    const diffMs = now.getTime() - this.sessionStartTime.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    
    return diffMins >= this.sessionTimeout;
  }
  
  /**
   * Get remaining session time in minutes
   */
  public getRemainingSessionTime(): number {
    if (this.isSessionExpired()) {
      return 0;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - this.sessionStartTime.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    
    return Math.max(0, this.sessionTimeout - diffMins);
  }
  
  /**
   * Reset session timer
   */
  public resetSession(): void {
    this.sessionStartTime = new Date();
  }
}

// Create singleton instance
export const tempFileStorage = new TempFileStorageService();
