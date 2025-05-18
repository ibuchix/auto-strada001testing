
/**
 * PhotoSection Component for car listing photo uploads
 * Created: 2025-07-19
 */
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Upload } from 'lucide-react';
import { PhotoItem } from '../types';

interface PhotoSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  photos: PhotoItem[];
  uploadedPhotos: Record<string, boolean>;
  activeUploads: Record<string, boolean>;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  onPhotoUploaded?: (type: string) => void;
  onUploadError?: (type: string, error: string) => void;
  onUploadRetry?: (type: string) => void;
}

export const PhotoSection = ({
  title,
  description,
  icon: Icon,
  photos,
  uploadedPhotos,
  activeUploads,
  progress = 0,
  onFileSelect,
  onPhotoUploaded,
  onUploadError,
  onUploadRetry
}: PhotoSectionProps) => {
  const [error, setError] = useState<Record<string, string>>({});
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Clear previous error
      setError(prev => ({ ...prev, [photoId]: '' }));
      
      // Upload the file
      const url = await onFileSelect(file, photoId);
      
      // Reset the file input
      e.target.value = '';
      
      // Notify parent of successful upload
      if (url && onPhotoUploaded) {
        onPhotoUploaded(photoId);
      }
    } catch (err: any) {
      console.error(`Error uploading ${photoId}:`, err);
      
      // Set error message
      setError(prev => ({ ...prev, [photoId]: err.message || 'Upload failed' }));
      
      // Notify parent of error
      if (onUploadError) {
        onUploadError(photoId, err.message || 'Upload failed');
      }
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-lg">{title}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="space-y-2">
              <div className="relative group">
                <Card className={`aspect-square ${uploadedPhotos[photo.id] ? 'border-green-500' : 'border-gray-200'}`}>
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    {uploadedPhotos[photo.id] ? (
                      <div className="flex flex-col items-center justify-center h-full w-full bg-green-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs text-green-700 mt-1">Uploaded</p>
                      </div>
                    ) : activeUploads[photo.id] ? (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-xs text-gray-500 mt-2">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <Upload className="h-8 w-8 text-gray-300" />
                        <p className="text-xs text-gray-500 mt-2">{photo.title}</p>
                        {photo.required && (
                          <span className="text-xs text-rose-500">Required</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {error[photo.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 p-2">
                    <div className="text-center">
                      <p className="text-xs text-red-600 font-medium mb-2">
                        {error[photo.id]}
                      </p>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => {
                          setError(prev => ({ ...prev, [photo.id]: '' }));
                          if (onUploadRetry) onUploadRetry(photo.id);
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <input
                  type="file"
                  id={`upload-${photo.id}`}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, photo.id)}
                  disabled={activeUploads[photo.id]}
                />
                <label
                  htmlFor={`upload-${photo.id}`}
                  className={`block text-xs ${uploadedPhotos[photo.id] ? 'text-green-600' : 'text-primary'} cursor-pointer hover:underline`}
                >
                  {uploadedPhotos[photo.id] ? 'Replace' : 'Upload'}
                </label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
