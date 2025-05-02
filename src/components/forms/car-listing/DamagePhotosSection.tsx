
/**
 * Damage Photos Section
 * Created: 2025-05-02
 */

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useFormData } from "./context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { Button } from "@/components/ui/button";
import { X, Upload, Image } from "lucide-react";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const isDamaged = form.watch('isDamaged');
  
  const { 
    files, 
    isUploading, 
    progress, 
    uploadFiles, 
    removeFile,
    clearFiles 
  } = useTemporaryFileUpload({
    category: 'damage_photos',
    allowMultiple: true,
    maxFiles: 10
  });
  
  // Update form when files change
  useEffect(() => {
    const fileIds = files.map(file => file.id);
    form.setValue('damagePhotos', fileIds, { shouldDirty: true });
  }, [files, form]);
  
  // Clear photos if car is not damaged
  useEffect(() => {
    if (!isDamaged && files.length > 0) {
      clearFiles();
    }
  }, [isDamaged, files.length, clearFiles]);
  
  // If car is not damaged, don't render the section
  if (!isDamaged) {
    return null;
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };
  
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Damage Photos
      </h2>
      
      <div className="space-y-6">
        <p className="text-gray-600">
          Since you've indicated that the vehicle has damage, please upload clear photos of all damaged areas.
          This helps us accurately assess the vehicle condition.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Damage Photos</h3>
            <input 
              type="file" 
              id="damage-photo-upload" 
              multiple 
              accept="image/*" 
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <label htmlFor="damage-photo-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Add Photos"}
                </span>
              </Button>
            </label>
          </div>
          
          {isUploading && (
            <div className="w-full">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {files.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden border bg-gray-100">
                    <img 
                      src={file.preview} 
                      alt="Damage photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Image className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">
                  No damage photos uploaded yet
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
