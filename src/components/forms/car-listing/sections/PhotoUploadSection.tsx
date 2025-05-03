
/**
 * PhotoUploadSection Component
 * Displays and handles car photo uploads
 * Updated: 2025-05-03 - Fixed TypeScript errors related to ExtendedStoredFile type
 */

import { FormField } from '@/components/ui/form';
import { useFormData } from '../context/FormDataContext';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Define a properly typed ExtendedStoredFile
interface ExtendedStoredFile {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  lastModified?: number;
}

export const PhotoUploadSection = () => {
  const { form } = useFormData();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ExtendedStoredFile[]>([]);

  // Monitor form's uploadedPhotos field
  useEffect(() => {
    const photos = form.watch('uploadedPhotos');
    if (photos && photos.length > 0) {
      // Convert strings to ExtendedStoredFile objects
      const filesFromUrls = photos.map((url: string, index: number) => {
        // Check if it's already an ExtendedStoredFile object
        if (typeof url === 'object' && url !== null) {
          return url as ExtendedStoredFile;
        }
        
        // Create ExtendedStoredFile from string URL
        return {
          id: `photo-${index}`,
          name: `Photo ${index + 1}`,
          url: url,
          type: 'image/jpeg', // Assume JPEG for string URLs
          size: 0
        };
      });
      
      setUploadedFiles(filesFromUrls);
    }
  }, [form.watch('uploadedPhotos')]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }
    
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);
    
    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);
    
    // Create file object
    const newFile: ExtendedStoredFile = {
      id: `upload-${Date.now()}`,
      name: file.name,
      url: fileUrl,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    };
    
    // Simulate upload completion after delay
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Add to uploaded files
      const updatedFiles = [...uploadedFiles, newFile];
      setUploadedFiles(updatedFiles);
      
      // Update form data - convert complex objects to URLs if needed
      const urls = updatedFiles.map(file => typeof file === 'string' ? file : file.url);
      form.setValue('uploadedPhotos', urls, { shouldValidate: true, shouldDirty: true });
      
      toast.success('Photo uploaded successfully');
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }, 1500);
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    const updated = [...uploadedFiles];
    updated.splice(index, 1);
    setUploadedFiles(updated);
    
    // Update form data
    const urls = updated.map(file => typeof file === 'string' ? file : file.url);
    form.setValue('uploadedPhotos', urls, { shouldValidate: true, shouldDirty: true });
    
    toast.success('Photo removed');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Vehicle Photos</h3>
      
      <FormField
        control={form.control}
        name="uploadedPhotos"
        render={() => (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Drag and drop photos here, or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Accepts: JPG, PNG (Max 10MB each)</p>
              
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4" 
                disabled={uploading}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                Browse Photos
              </Button>
              
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            
            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}
            
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-600">Upload progress: {uploadProgress}%</p>
              </div>
            )}
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Uploaded Photos ({uploadedFiles.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={file.id || index} className="relative group">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="rounded-md object-cover aspect-video w-full"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Main Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};
