
/**
 * Temporary File Storage Service
 * Created: 2025-06-16
 * 
 * Handles temporary file storage during form sessions
 */

import { TempStoredFile } from "@/types/forms";

export interface TempStorageOptions {
  sessionDuration: number; // in minutes
}

class TempFileStorageService {
  private files: TempStoredFile[] = [];
  private sessionStartTime: Date;
  private sessionDuration: number; // in minutes
  
  constructor(options: TempStorageOptions = { sessionDuration: 60 }) {
    this.sessionStartTime = new Date();
    this.sessionDuration = options.sessionDuration;
  }
  
  // Add a file to temporary storage
  async addFile(file: File, category: string): Promise<TempStoredFile> {
    // Create a unique ID for the file
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create object URL for preview
    const url = URL.createObjectURL(file);
    
    // Create temp stored file object
    const tempFile: TempStoredFile = {
      id,
      file,
      category,
      url,
      createdAt: new Date()
    };
    
    // Add to files array
    this.files.push(tempFile);
    
    return tempFile;
  }
  
  // Get a file by ID
  getFile(id: string): TempStoredFile | undefined {
    return this.files.find(file => file.id === id);
  }
  
  // Get all files
  getAllFiles(): TempStoredFile[] {
    return [...this.files];
  }
  
  // Get files by category
  getFilesByCategory(category: string): TempStoredFile[] {
    return this.files.filter(file => file.category === category);
  }
  
  // Remove a file by ID
  removeFile(id: string): boolean {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex !== -1) {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(this.files[fileIndex].url);
      
      // Remove from array
      this.files.splice(fileIndex, 1);
      return true;
    }
    return false;
  }
  
  // Remove a file by name
  removeFileByName(name: string): boolean {
    const fileIndex = this.files.findIndex(file => file.file.name === name);
    if (fileIndex !== -1) {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(this.files[fileIndex].url);
      
      // Remove from array
      this.files.splice(fileIndex, 1);
      return true;
    }
    return false;
  }
  
  // Clear all files
  clearAll(): void {
    // Revoke all object URLs
    this.files.forEach(file => URL.revokeObjectURL(file.url));
    
    // Clear array
    this.files = [];
  }
  
  // Get session progress
  getSessionProgress(): number {
    const elapsedMinutes = this.getElapsedSessionTime();
    return Math.min(100, Math.round((elapsedMinutes / this.sessionDuration) * 100));
  }
  
  // Get elapsed session time in minutes
  getElapsedSessionTime(): number {
    const now = new Date();
    const elapsedMs = now.getTime() - this.sessionStartTime.getTime();
    return Math.floor(elapsedMs / (1000 * 60));
  }
  
  // Get remaining session time in minutes
  getRemainingSessionTime(): number {
    const elapsedMinutes = this.getElapsedSessionTime();
    return Math.max(0, this.sessionDuration - elapsedMinutes);
  }
  
  // Reset session timer
  resetSession(): void {
    this.sessionStartTime = new Date();
  }
  
  // Check if session is expired
  isSessionExpired(): boolean {
    return this.getRemainingSessionTime() <= 0;
  }
}

// Create singleton instance with a 60-minute session duration
export const tempFileStorage = new TempFileStorageService({ sessionDuration: 60 });
