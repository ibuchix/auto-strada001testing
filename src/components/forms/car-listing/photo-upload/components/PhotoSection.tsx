
/**
 * Component for displaying and uploading photos by category
 * Created: 2025-07-18
 */
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, UploadCloud, LucideIcon } from "lucide-react";
import { cn } from '@/lib/utils';

interface PhotoSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  photos: {
    id: string;
    title: string;
    description?: string;
    required?: boolean;
  }[];
  uploadedPhotos: Record<string, boolean>;
  activeUploads: Record<string, boolean>;
  progress: number;
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
  progress,
  onFileSelect,
  onPhotoUploaded,
  onUploadError,
  onUploadRetry,
}: PhotoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden border-2 transition-colors duration-200">
            <CardContent className="p-0 relative aspect-square">
              {uploadedPhotos[photo.id] ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-green-100 text-green-800 text-xs font-medium rounded px-2.5 py-1">
                      Uploaded
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={cn(
                    "h-full flex flex-col items-center justify-center p-4 text-center",
                    activeUploads[photo.id] ? "bg-gray-100" : ""
                  )}
                >
                  {activeUploads[photo.id] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{photo.title}</p>
                      {photo.description && (
                        <p className="text-xs text-gray-500 mt-1">{photo.description}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between p-2 bg-gray-50">
              {photo.required && (
                <Badge variant="outline" className="bg-white">Required</Badge>
              )}
              
              <input
                type="file"
                id={`upload-${photo.id}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onFileSelect(e.target.files[0], photo.id)
                      .then((result) => {
                        if (result && onPhotoUploaded) {
                          onPhotoUploaded(photo.id);
                        }
                      })
                      .catch((error) => {
                        if (onUploadError) {
                          onUploadError(photo.id, error.message || 'Upload failed');
                        }
                      });
                    e.target.value = '';
                  }
                }}
              />
              
              {uploadedPhotos[photo.id] ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    // Add logic to remove the photo
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeUploads[photo.id]}
                  asChild
                >
                  <label htmlFor={`upload-${photo.id}`}>Upload</label>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
