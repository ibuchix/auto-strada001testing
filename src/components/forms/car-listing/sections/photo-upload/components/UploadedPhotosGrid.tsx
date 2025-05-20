
/**
 * Uploaded photos grid component
 * Created: 2025-05-20
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { FormLabel } from "../../../FormSection";

interface UploadedPhotosGridProps {
  photos: string[];
  onRemovePhoto: (index: number) => void;
}

export const UploadedPhotosGrid: React.FC<UploadedPhotosGridProps> = ({
  photos,
  onRemovePhoto
}) => {
  if (photos.length === 0) return null;
  
  return (
    <div>
      <FormLabel>Uploaded Photos ({photos.length})</FormLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
            <img 
              src={photo} 
              alt={`Vehicle photo ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => onRemovePhoto(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
