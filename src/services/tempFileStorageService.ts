
/**
 * Temporary File Storage Service
 * Created: 2025-07-10
 */

import { v4 as uuidv4 } from "uuid";

interface StoredFile {
  id: string;
  file: File;
  field: string;
  url: string;
  createdAt: Date;
}

/**
 * Service for managing temporary file storage before uploading to permanent storage
 */
class TempFileStorageService {
  private files: Map<string, StoredFile> = new Map();

  /**
   * Add a file to temporary storage
   */
  addFile(file: File, field: string): string {
    const id = uuidv4();
    const url = URL.createObjectURL(file);
    
    this.files.set(id, {
      id,
      file,
      field,
      url,
      createdAt: new Date()
    });
    
    return id;
  }

  /**
   * Remove a file from temporary storage
   */
  removeFile(id: string): boolean {
    const file = this.files.get(id);
    if (file) {
      URL.revokeObjectURL(file.url);
      return this.files.delete(id);
    }
    return false;
  }

  /**
   * Remove a file by name
   */
  removeFileByName(fileName: string): boolean {
    for (const [id, storedFile] of this.files.entries()) {
      if (storedFile.file.name === fileName) {
        URL.revokeObjectURL(storedFile.url);
        return this.files.delete(id);
      }
    }
    return false;
  }

  /**
   * Get a file from temporary storage
   */
  getFile(id: string): StoredFile | undefined {
    return this.files.get(id);
  }

  /**
   * Get all files for a particular field
   */
  getFilesForField(field: string): StoredFile[] {
    return Array.from(this.files.values())
      .filter(storedFile => storedFile.field === field);
  }

  /**
   * Get all files in temporary storage
   */
  getAllFiles(): StoredFile[] {
    return Array.from(this.files.values());
  }

  /**
   * Clear all files from temporary storage
   */
  clearFiles(): void {
    for (const file of this.files.values()) {
      URL.revokeObjectURL(file.url);
    }
    this.files.clear();
  }
}

// Singleton instance
export const tempFileStorage = new TempFileStorageService();

export default tempFileStorage;
