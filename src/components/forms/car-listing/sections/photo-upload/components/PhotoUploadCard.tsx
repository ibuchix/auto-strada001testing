
/**
 * Photo upload card component 
 * Created: 2025-05-20
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface PhotoUploadCardProps {
  isUploading: boolean;
  uploadProgress: number;
  onSelectFiles: () => void;
}

export const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({
  isUploading,
  uploadProgress,
  onSelectFiles
}) => {
  return (
    <Card className="p-6">
      <Button
        type="button"
        variant="outline"
        className="w-full h-40 border-dashed flex flex-col items-center justify-center"
        disabled={isUploading}
        onClick={onSelectFiles}
      >
        <Upload className="h-10 w-10 mb-2 text-gray-500" />
        <span>Click to upload photos</span>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG (max 10MB each)</p>
      </Button>
      
      {isUploading && (
        <div className="mt-4 space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-gray-500">
            Uploading photos...
          </p>
        </div>
      )}
    </Card>
  );
};
