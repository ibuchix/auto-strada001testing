
/**
 * Temporary file storage service
 * Created: 2025-07-02
 * Updated: 2025-07-23 - Added missing methods and improved type definitions
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
  
  // Remove a file by name
  removeFileByName(fileName: string): boolean {
    let removed = false;
    
    Object.keys(this.storage).forEach(field => {
      const initialLength = this.storage[field].length;
      this.storage[field] = this.storage[field].filter(file => file.file.name !== fileName);
      
      if (this.storage[field].length < initialLength) {
        removed = true;
      }
    });
    
    return removed;
  }
  
  // Get a file by ID
  getFileById(id: string): TempStoredFile | null {
    for (const field in this.storage) {
      const file = this.storage[field].find(file => file.id === id);
      if (file) {
        return file;
      }
    }
    
    return null;
  }
  
  // Add a preview URL to a file
  addPreview(field: string, id: string, previewUrl: string): TempStoredFile | null {
    if (!this.storage[field]) return null;
    
    const fileIndex = this.storage[field].findIndex(file => file.id === id);
    if (fileIndex === -1) return null;
    
    this.storage[field][fileIndex].preview = previewUrl;
    return this.storage[field][fileIndex];
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
  
  // Create a file object with temporary URL for preview
  createFileWithPreview(file: File): Promise<TempStoredFile> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const id = crypto.randomUUID();
      
      reader.onloadend = () => {
        const storedFile: TempStoredFile = {
          id,
          file,
          field: 'temp',
          preview: reader.result as string,
          timestamp: Date.now()
        };
        
        resolve(storedFile);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  // Add a new file with preview
  async addFile(file: File, field: string = 'temp'): Promise<TempStoredFile> {
    const fileWithPreview = await this.createFileWithPreview(file);
    fileWithPreview.field = field;
    
    if (!this.storage[field]) {
      this.storage[field] = [];
    }
    
    this.storage[field].push(fileWithPreview);
    return fileWithPreview;
  }
}

// Create and export a singleton instance
export const tempFileStorage = new TempFileStorageService();
