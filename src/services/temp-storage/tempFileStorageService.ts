
/**
 * Temporary File Storage Service
 * Created: 2025-05-02
 * 
 * This service manages temporary file storage during the form completion process.
 * Files are stored in memory/localStorage until the form is submitted.
 */

import { v4 as uuidv4 } from 'uuid';

// Define types for stored files
export interface TempStoredFile {
  id: string;
  file: File;
  preview: string;
  category: string;
  uploadedAt: Date;
}

// Main storage state
class TempFileStorageService {
  private files: Map<string, TempStoredFile> = new Map();
  private sessionStartTime: Date = new Date();
  private sessionDuration: number = 60 * 60 * 1000; // 1 hour in milliseconds
  
  constructor() {
    this.setupSessionTimeout();
  }
  
  /**
   * Store a file in temporary storage
   * @returns The ID of the stored file
   */
  storeFile(file: File, category: string): TempStoredFile {
    const id = uuidv4();
    const preview = URL.createObjectURL(file);
    
    const storedFile: TempStoredFile = {
      id,
      file,
      preview,
      category,
      uploadedAt: new Date()
    };
    
    this.files.set(id, storedFile);
    
    // Store session info in localStorage for recovery
    this.updateLocalStorageIndex();
    
    return storedFile;
  }
  
  /**
   * Get all files in a specific category
   */
  getFilesByCategory(category: string): TempStoredFile[] {
    return Array.from(this.files.values())
      .filter(file => file.category === category);
  }
  
  /**
   * Get all files
   */
  getAllFiles(): TempStoredFile[] {
    return Array.from(this.files.values());
  }
  
  /**
   * Remove a file by ID
   */
  removeFile(id: string): boolean {
    const file = this.files.get(id);
    if (file) {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(file.preview);
      this.files.delete(id);
      this.updateLocalStorageIndex();
      return true;
    }
    return false;
  }
  
  /**
   * Remove all files in a category
   */
  clearCategory(category: string): void {
    const filesToRemove = Array.from(this.files.entries())
      .filter(([_, file]) => file.category === category);
      
    filesToRemove.forEach(([id, file]) => {
      URL.revokeObjectURL(file.preview);
      this.files.delete(id);
    });
    
    this.updateLocalStorageIndex();
  }
  
  /**
   * Clear all stored files
   */
  clearAll(): void {
    // Clean up object URLs
    this.files.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    
    this.files.clear();
    localStorage.removeItem('car_listing_temp_files');
    this.sessionStartTime = new Date();
  }
  
  /**
   * Get remaining session time in minutes
   */
  getRemainingSessionTime(): number {
    const elapsed = Date.now() - this.sessionStartTime.getTime();
    const remaining = this.sessionDuration - elapsed;
    return Math.max(0, Math.floor(remaining / (60 * 1000))); // Convert to minutes
  }
  
  /**
   * Setup session timeout
   */
  private setupSessionTimeout(): void {
    // Check if we have an existing session stored
    const storedSession = localStorage.getItem('car_listing_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        this.sessionStartTime = new Date(parsedSession.startTime);
        
        // If session is expired, start a new one
        if (this.getRemainingSessionTime() <= 0) {
          this.resetSession();
        }
      } catch (e) {
        this.resetSession();
      }
    } else {
      this.resetSession();
    }
  }
  
  /**
   * Reset session
   */
  private resetSession(): void {
    this.sessionStartTime = new Date();
    localStorage.setItem('car_listing_session', JSON.stringify({
      startTime: this.sessionStartTime.toISOString()
    }));
    this.clearAll();
  }
  
  /**
   * Update localStorage index of files
   * This doesn't store the actual files, just metadata for recovery
   */
  private updateLocalStorageIndex(): void {
    const fileIndex = Array.from(this.files.values()).map(file => ({
      id: file.id,
      name: file.file.name,
      category: file.category,
      uploadedAt: file.uploadedAt.toISOString()
    }));
    
    try {
      localStorage.setItem('car_listing_temp_files', JSON.stringify(fileIndex));
    } catch (e) {
      console.error('Error storing file index to localStorage:', e);
    }
  }
}

// Create a singleton instance
export const tempFileStorage = new TempFileStorageService();
