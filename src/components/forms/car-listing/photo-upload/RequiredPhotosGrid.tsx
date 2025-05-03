
/**
 * Required Photos Grid Component
 * Created: 2025-05-12
 * Purpose: Grid layout for required vehicle photos
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PhotoUploaderProps {
  files: {
    id: string;
    name: string;
    preview: string | null;
    url: string | null;
  }[];
  isUploading: boolean;
  progress: number;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
}

interface RequiredPhotosGridProps {
  frontView: PhotoUploaderProps;
  rearView: PhotoUploaderProps;
  driverSide: PhotoUploaderProps;
  passengerSide: PhotoUploaderProps;
  dashboard: PhotoUploaderProps;
  interiorFront: PhotoUploaderProps;
  interiorRear: PhotoUploaderProps;
}

const PhotoUploadBox = ({ 
  title, 
  uploader, 
  inputId 
}: { 
  title: string; 
  uploader: PhotoUploaderProps; 
  inputId: string;
}) => {
  const hasFile = uploader.files.length > 0;
  const firstFile = uploader.files[0];
  
  return (
    <div className="flex flex-col">
      <div className="text-sm font-medium mb-2">{title}</div>
      
      <div className="border rounded-md aspect-square overflow-hidden bg-gray-50 relative">
        {hasFile && firstFile.preview ? (
          <>
            <img 
              src={firstFile.preview} 
              alt={title} 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
              onClick={() => uploader.removeFile(firstFile.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <input 
              type="file" 
              id={inputId} 
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && uploader.uploadFiles(e.target.files)}
            />
            <label 
              htmlFor={inputId} 
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <Upload className="h-8 w-8 mb-2 text-gray-400" />
              <span className="text-sm text-gray-500">Upload photo</span>
            </label>
          </>
        )}
        
        {uploader.isUploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1">
            <Progress value={uploader.progress} className="h-1" />
            <div className="text-xs text-center">Uploading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RequiredPhotosGrid: React.FC<RequiredPhotosGridProps> = ({
  frontView,
  rearView,
  driverSide,
  passengerSide,
  dashboard,
  interiorFront,
  interiorRear
}) => {
  return (
    <div>
      <div className="text-sm font-medium mb-3">Required Photos</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <PhotoUploadBox 
          title="Front View" 
          uploader={frontView} 
          inputId="front-view-upload" 
        />
        
        <PhotoUploadBox 
          title="Rear View" 
          uploader={rearView} 
          inputId="rear-view-upload" 
        />
        
        <PhotoUploadBox 
          title="Driver Side" 
          uploader={driverSide} 
          inputId="driver-side-upload" 
        />
        
        <PhotoUploadBox 
          title="Passenger Side" 
          uploader={passengerSide} 
          inputId="passenger-side-upload" 
        />
        
        <PhotoUploadBox 
          title="Dashboard" 
          uploader={dashboard} 
          inputId="dashboard-upload" 
        />
        
        <PhotoUploadBox 
          title="Interior Front" 
          uploader={interiorFront} 
          inputId="interior-front-upload" 
        />
        
        <PhotoUploadBox 
          title="Interior Rear" 
          uploader={interiorRear} 
          inputId="interior-rear-upload" 
        />
      </div>
    </div>
  );
};
