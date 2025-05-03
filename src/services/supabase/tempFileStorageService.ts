
/**
 * Temporary file storage service
 * Created: 2025-04-12
 * Updated: 2025-05-03 - Added more file management methods
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

interface StoredFile {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
}

class TempFileStorageService {
  private bucket = 'temp-uploads';
  private fileRegistry: Map<string, StoredFile> = new Map();
  
  constructor() {
    this.initializeFileRegistry();
  }
  
  private initializeFileRegistry(): void {
    try {
      const storedRegistry = localStorage.getItem('temp-files-registry');
      if (storedRegistry) {
        const parsedRegistry = JSON.parse(storedRegistry);
        for (const [key, value] of Object.entries(parsedRegistry)) {
          this.fileRegistry.set(key, value as StoredFile);
        }
      }
    } catch (error) {
      console.error('Failed to initialize file registry:', error);
    }
  }
  
  private saveRegistry(): void {
    try {
      const registryObj = Object.fromEntries(this.fileRegistry.entries());
      localStorage.setItem('temp-files-registry', JSON.stringify(registryObj));
    } catch (error) {
      console.error('Failed to save file registry:', error);
    }
  }
  
  async addFile(file: File): Promise<StoredFile> {
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const filePath = `${fileId}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(filePath, file);
      
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
      
    const storedFile: StoredFile = {
      id: fileId,
      name: file.name,
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type
    };
    
    this.fileRegistry.set(fileId, storedFile);
    this.saveRegistry();
    
    return storedFile;
  }
  
  getFile(fileId: string): StoredFile | undefined {
    return this.fileRegistry.get(fileId);
  }
  
  getAllFiles(): StoredFile[] {
    return Array.from(this.fileRegistry.values());
  }
  
  removeFile(fileId: string): boolean {
    if (!this.fileRegistry.has(fileId)) {
      return false;
    }
    
    const file = this.fileRegistry.get(fileId);
    if (file) {
      // Delete from Supabase storage
      supabase.storage
        .from(this.bucket)
        .remove([file.path])
        .catch(error => console.error('Failed to delete file from storage:', error));
      
      this.fileRegistry.delete(fileId);
      this.saveRegistry();
      return true;
    }
    
    return false;
  }
  
  removeFileByName(fileName: string): boolean {
    for (const [fileId, file] of this.fileRegistry.entries()) {
      if (file.name === fileName) {
        return this.removeFile(fileId);
      }
    }
    return false;
  }
  
  async moveToPermStorage(fileId: string, destinationPath: string, bucket: string = 'cars'): Promise<string | null> {
    const file = this.fileRegistry.get(fileId);
    if (!file) {
      return null;
    }
    
    try {
      // Download file from temp storage
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(this.bucket)
        .download(file.path);
        
      if (downloadError || !downloadData) {
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data returned'}`);
      }
      
      // Upload to permanent storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(destinationPath, downloadData);
        
      if (uploadError) {
        throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(destinationPath);
        
      // Clean up temporary file
      this.removeFile(fileId);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error moving file to permanent storage:', error);
      return null;
    }
  }
  
  clearAll(): void {
    const filePaths = Array.from(this.fileRegistry.values()).map(file => file.path);
    
    if (filePaths.length > 0) {
      supabase.storage
        .from(this.bucket)
        .remove(filePaths)
        .catch(error => console.error('Failed to delete files from storage:', error));
    }
    
    this.fileRegistry.clear();
    this.saveRegistry();
  }
}

export const tempFileStorageService = new TempFileStorageService();
