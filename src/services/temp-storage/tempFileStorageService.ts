
/**
 * Temporary file storage service
 * Created: 2025-07-02
 */

// Define a basic temp file storage service interface
export interface TempStoredFile {
  id: string;
  file: File;
  field: string;
  preview?: string;
  timestamp: number;
}

export class TempFileStorageService {
  private storage: Record<string, TempStoredFile[]> = {};
  private sessionStartTime: number = Date.now();
  private sessionDuration: number = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // Store a file
  store(field: string, file: File, id?: string): TempStoredFile {
    if (!this.storage[field]) {
      this.storage[field] = [];
    }
    
    const storedFile: TempStoredFile = {
      id: id || crypto.randomUUID(),
      file,
      field,
      timestamp: Date.now(),
    };
    
    this.storage[field].push(storedFile);
    return storedFile;
  }
  
  // Get all files for a field
  get(field: string): TempStoredFile[] | null {
    return this.storage[field] || null;
  }
  
  // Get files for a specific field
  getFilesForField(field: string): TempStoredFile[] {
    return this.storage[field] || [];
  }
  
  // Remove a file by ID
  remove(field: string, id: string): boolean {
    if (!this.storage[field]) return false;
    
    const initialLength = this.storage[field].length;
    this.storage[field] = this.storage[field].filter(file => file.id !== id);
    
    return this.storage[field].length < initialLength;
  }
  
  // Clear all files for a field
  clear(field: string): void {
    delete this.storage[field];
  }
  
  // Clear all storage
  clearAll(): void {
    this.storage = {};
  }
  
  // Get remaining session time in minutes
  getRemainingSessionTime(): number {
    const elapsedTime = Date.now() - this.sessionStartTime;
    const remainingTime = this.sessionDuration - elapsedTime;
    
    // Convert to minutes and round
    return Math.max(0, Math.ceil(remainingTime / (60 * 1000)));
  }
}

// Create and export a singleton instance
export const tempFileStorage = new TempFileStorageService();
