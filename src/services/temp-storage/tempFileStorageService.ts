
/**
 * Temporary File Storage Service
 * Created: 2025-05-03
 * 
 * Service to temporarily store files in memory/localStorage during form completion
 */

// 1 hour in milliseconds
const SESSION_TIMEOUT = 60 * 60 * 1000;

export interface TempStoredFile {
  id: string;
  file: File;
  preview: string;
  category: string;
  createdAt: number;
}

class TempFileStorage {
  private files: Map<string, TempStoredFile> = new Map();
  private sessionStartTime: number;
  
  constructor() {
    this.sessionStartTime = Date.now();
    // Pre-populate with any files saved in sessionStorage
    this.loadFromSession();
  }
  
  /**
   * Store a file in temporary storage
   */
  storeFile(file: File, category: string): TempStoredFile {
    const id = crypto.randomUUID();
    const preview = URL.createObjectURL(file);
    
    const storedFile: TempStoredFile = {
      id,
      file,
      preview,
      category,
      createdAt: Date.now()
    };
    
    this.files.set(id, storedFile);
    this.saveToSession();
    
    return storedFile;
  }
  
  /**
   * Get a file by ID
   */
  getFile(id: string): TempStoredFile | undefined {
    return this.files.get(id);
  }
  
  /**
   * Get all files in a specific category
   */
  getFilesByCategory(category: string): TempStoredFile[] {
    return Array.from(this.files.values())
      .filter(file => file.category === category);
  }
  
  /**
   * Get all files across all categories
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
      URL.revokeObjectURL(file.preview);
      this.files.delete(id);
      this.saveToSession();
      return true;
    }
    return false;
  }
  
  /**
   * Clear all files in a category
   */
  clearCategory(category: string): void {
    const filesToRemove = this.getFilesByCategory(category);
    filesToRemove.forEach(file => {
      URL.revokeObjectURL(file.preview);
      this.files.delete(file.id);
    });
    this.saveToSession();
  }
  
  /**
   * Clear all files
   */
  clearAll(): void {
    this.files.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    this.files.clear();
    sessionStorage.removeItem('tempFiles');
  }
  
  /**
   * Get remaining session time in minutes
   */
  getRemainingSessionTime(): number {
    const elapsedTime = Date.now() - this.sessionStartTime;
    const remainingTime = Math.max(0, SESSION_TIMEOUT - elapsedTime);
    return Math.ceil(remainingTime / (60 * 1000)); // Convert to minutes
  }
  
  /**
   * Save file metadata to session storage
   * Note: We can't store the actual File objects or preview URLs,
   * so we just store enough info to track what files we have
   */
  private saveToSession(): void {
    try {
      const serializable = Array.from(this.files.entries()).map(([id, file]) => ({
        id,
        category: file.category,
        name: file.file.name,
        type: file.file.type,
        size: file.file.size,
        createdAt: file.createdAt,
      }));
      sessionStorage.setItem('tempFiles', JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving to session storage:', error);
    }
  }
  
  /**
   * Attempt to load file metadata from session storage
   * Note: Actual files cannot be restored, this is mainly
   * to track session time
   */
  private loadFromSession(): void {
    try {
      const stored = sessionStorage.getItem('tempFiles');
      if (stored) {
        const data = JSON.parse(stored);
        const startTime = Math.min(...data.map((item: any) => item.createdAt)) || Date.now();
        // Use the earliest createdAt time as the session start time
        this.sessionStartTime = startTime;
      }
    } catch (error) {
      console.error('Error loading from session storage:', error);
    }
  }
}

// Create a singleton instance
export const tempFileStorage = new TempFileStorage();
