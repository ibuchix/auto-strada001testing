
/**
 * PhotosSection Component
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 */
import { useState, useEffect } from "react";
import { useFormData } from "./context/FormDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Progress } from "@/components/ui/progress";

interface PhotosSectionProps {
  carId?: string;
}

export const PhotosSection = ({ carId }: PhotosSectionProps) => {
  const { form } = useFormData();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    uploadImages, 
    isUploading, 
    uploadProgress, 
    uploadSuccess,
    selectedImages,
    removeSelectedImage
  } = useImageUpload({
    category: 'car_photos',
    maxFiles: 20
  });
  
  const uploadedPhotos = form.watch('uploaded_photos') || [];
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setErrorMessage(null);
      
      // Check if we're exceeding the max number of photos
      if (uploadedPhotos.length + e.target.files.length > 20) {
        setErrorMessage(`You can only upload a maximum of 20 photos. You already have ${uploadedPhotos.length}.`);
        return;
      }
      
      // Upload the images
      const imageUrls = await uploadImages(e.target.files, carId);
      
      if (imageUrls && imageUrls.length > 0) {
        // Update the form with the new image URLs
        const newUploadedPhotos = [...uploadedPhotos, ...imageUrls];
        form.setValue('uploaded_photos', newUploadedPhotos, { shouldDirty: true });
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload images");
    }
  };
  
  // Remove an uploaded photo
  const removePhoto = (index: number) => {
    const newPhotos = [...uploadedPhotos];
    newPhotos.splice(index, 1);
    form.setValue('uploaded_photos', newPhotos, { shouldDirty: true });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Photos</CardTitle>
        <CardDescription>
          Upload high-quality photos of your vehicle to attract more buyers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <div className="flex flex-col items-center">
            {uploadSuccess ? (
              <div className="text-green-500 flex flex-col items-center">
                <Check className="h-10 w-10" />
                <p className="mt-2">Upload successful!</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-muted-foreground">
                  Drag and drop your photos here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or HEIC up to 10MB each (max 20 photos)
                </p>
              </>
            )}
            
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            
            <label htmlFor="photo-upload">
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                disabled={isUploading}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Photos
                </span>
              </Button>
            </label>
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
        
        {/* Display uploaded photos */}
        {uploadedPhotos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Uploaded Photos ({uploadedPhotos.length}/20)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={photo}
                    alt={`Vehicle photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Display selected images that are being uploaded */}
        {selectedImages.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Selected Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={image.preview}
                    alt={`Selected image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSelectedImage(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
