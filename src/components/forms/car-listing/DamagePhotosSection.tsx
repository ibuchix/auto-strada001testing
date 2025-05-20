
/**
 * Damage Photos Section
 * Created: 2025-05-03
 * Updated: 2025-06-18 - Fixed type errors with temporary file upload hook
 * Updated: 2025-07-22 - Fixed field name from "damagePhotos" to the correct type
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * 
 * Component for uploading photos of vehicle damage
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFormData } from "./context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const [isDamaged, setIsDamaged] = useState(false);
  
  // Get isDamaged value from form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'isDamaged' || name === undefined) {
        setIsDamaged(!!value.isDamaged);
      }
    });
    
    // Initialize with current value
    setIsDamaged(!!form.getValues('isDamaged'));
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Use temporary file storage for damage photos
  const { 
    files, 
    isUploading, 
    progress, 
    uploadFiles, 
    removeFile 
  } = useTemporaryFileUpload({
    category: 'damage_photos',
    allowMultiple: true,
    maxFiles: 10
  });
  
  // Update form data when files change
  useEffect(() => {
    const photoPreviews = files.map(file => file.preview || file.url);
    form.setValue('damagePhotos', photoPreviews, { shouldDirty: true });
  }, [files, form]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };
  
  // If vehicle isn't damaged, don't show this section
  if (!isDamaged) {
    return null;
  }
  
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Damage Photos
      </h2>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Since you've indicated your vehicle has damage, please upload clear photos of all damaged areas.
          This will help provide an accurate assessment.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Damage Photos</h3>
            <p className="text-sm text-muted-foreground">
              Upload up to 10 photos of the damaged areas
            </p>
          </div>
          
          <input
            id="damage-photos-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading || files.length >= 10}
          />
          
          <label htmlFor="damage-photos-upload">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading || files.length >= 10}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Add Photos
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
        
        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden border bg-gray-100">
                  <img 
                    src={file.preview || file.url} 
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
        )}
      </div>
    </Card>
  );
};
