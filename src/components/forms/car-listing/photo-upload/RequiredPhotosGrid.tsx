
/**
 * Required Photos Grid Component
 * Created: 2025-05-02
 */

import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TempStoredFile } from '@/services/temp-storage/tempFileStorageService';

interface PhotoUploadState {
  files: TempStoredFile[];
  isUploading: boolean;
  progress: number;
  uploadFiles: (files: FileList | File[]) => Promise<TempStoredFile[] | undefined>;
  removeFile: (id: string) => boolean;
}

interface RequiredPhotosGridProps {
  frontView: PhotoUploadState;
  rearView: PhotoUploadState;
  driverSide: PhotoUploadState;
  passengerSide: PhotoUploadState;
  dashboard: PhotoUploadState;
  interiorFront: PhotoUploadState;
  interiorRear: PhotoUploadState;
}

export const RequiredPhotosGrid: React.FC<RequiredPhotosGridProps> = ({
  frontView,
  rearView,
  driverSide,
  passengerSide,
  dashboard,
  interiorFront,
  interiorRear
}) => {
  const renderPhotoCard = (
    title: string, 
    description: string, 
    state: PhotoUploadState, 
    inputId: string
  ) => {
    const hasPhoto = state.files.length > 0;
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        state.uploadFiles(e.target.files);
      }
    };
    
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 bg-gray-50">
          <h3 className="text-sm font-medium">{title}</h3>
        </CardHeader>
        <CardContent className="p-0">
          {hasPhoto ? (
            <div className="relative group">
              <div className="aspect-square">
                <img 
                  src={state.files[0]?.preview}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => state.removeFile(state.files[0]?.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-50">
              <input 
                type="file" 
                id={inputId} 
                accept="image/*" 
                className="hidden"
                onChange={handleFileSelect}
                disabled={state.isUploading}
              />
              <label htmlFor={inputId} className="cursor-pointer text-center">
                <Upload className="h-6 w-6 mb-2 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500 mb-2">
                  {description}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={state.isUploading}
                  className="cursor-pointer text-xs"
                  asChild
                >
                  <span>Upload</span>
                </Button>
              </label>
              
              {state.isUploading && (
                <div className="w-full mt-2">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-1 bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Required Photos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {renderPhotoCard(
          "Front View", 
          "Front of vehicle", 
          frontView, 
          "front-view-upload"
        )}
        {renderPhotoCard(
          "Rear View", 
          "Back of vehicle", 
          rearView, 
          "rear-view-upload"
        )}
        {renderPhotoCard(
          "Driver Side", 
          "Full side view", 
          driverSide, 
          "driver-side-upload"
        )}
        {renderPhotoCard(
          "Passenger Side", 
          "Full side view", 
          passengerSide, 
          "passenger-side-upload"
        )}
        {renderPhotoCard(
          "Dashboard", 
          "Instrument panel", 
          dashboard, 
          "dashboard-upload"
        )}
        {renderPhotoCard(
          "Interior Front", 
          "Front seats", 
          interiorFront, 
          "interior-front-upload"
        )}
        {renderPhotoCard(
          "Interior Rear", 
          "Back seats", 
          interiorRear, 
          "interior-rear-upload"
        )}
      </div>
    </div>
  );
};
