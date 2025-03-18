
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of required photos component
 * - 2024-03-19: Added upload progress tracking
 * - 2024-03-19: Implemented grid layout for photo uploads
 * - 2024-08-09: Enhanced with categories for better organization
 */

import { PhotoUpload } from "./PhotoUpload";
import { requiredPhotos } from "./types";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface RequiredPhotosProps {
  isUploading: boolean;
  onFileSelect: (file: File, type: string) => void;
  progress?: number;
}

export const RequiredPhotos = ({ isUploading, onFileSelect, progress }: RequiredPhotosProps) => {
  const [activeCategory, setActiveCategory] = useState("exterior");
  const totalPhotos = requiredPhotos.length;
  const uploadProgress = (progress || 0) * (100 / totalPhotos);

  // Group photos by category
  const photosByCategory = requiredPhotos.reduce((acc, photo) => {
    if (!acc[photo.category]) {
      acc[photo.category] = [];
    }
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, typeof requiredPhotos>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Required Photos</h3>
        <Progress value={uploadProgress} className="mb-4" />
        <p className="text-sm text-subtitle mb-4">
          Upload progress: {Math.round(uploadProgress)}%
        </p>
      </div>

      <Tabs defaultValue="exterior" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full mb-4">
          {Object.keys(photosByCategory).map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="flex-1 capitalize"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(photosByCategory).map(([category, photos]) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photos.map(({ id, label }) => (
                <PhotoUpload
                  key={id}
                  id={id}
                  label={label}
                  isUploading={isUploading}
                  onFileSelect={(file) => onFileSelect(file, id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
