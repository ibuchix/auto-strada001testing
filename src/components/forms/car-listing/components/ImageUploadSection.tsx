
/**
 * Image Upload Section for car listing forms
 * Created: 2025-06-04
 * Updated: 2025-05-19 - Enhanced upload tracking, added better form integration and fallback mechanisms
 * 
 * This component handles image uploads and prevents auto-saving during uploads
 * to avoid performance issues and flickering.
 */

import { useCallback, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useFormController } from "../hooks/useFormController";
import { useImageUploadManager } from "../hooks/useImageUploadManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

interface ImageUploadSectionProps {
  maxImages?: number;
  carId?: string;
  pauseAutoSave?: () => void;
  resumeAutoSave?: () => void;
}

export const ImageUploadSection = ({
  maxImages = 10,
  carId,
  pauseAutoSave,
  resumeAutoSave
}: ImageUploadSectionProps) => {
  const form = useFormContext<CarListingFormData>();
  const [images, setImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadRetries, setUploadRetries] = useState<{[key: string]: number}>({});
  const maxRetriesPerFile = 3;
  
  // Use the image upload manager to handle uploads and auto-save pausing
  const {
    isUploading,
    uploadProgress,
    startUpload,
    finishUpload,
    updateProgress,
    registerPendingFile,
    checkUploadsComplete,
    uploadDirectToStorage
  } = useImageUploadManager({ 
    form, 
    pauseAutoSave, 
    resumeAutoSave, 
    carId 
  });
  
  // Initialize images from form data on mount
  useEffect(() => {
    const formImages = form.getValues().images || [];
    setImages(Array.isArray(formImages) ? formImages : []);
    
    // Log connection status
    console.log('[ImageUploadSection] Connected to image upload manager', { 
      carId,
      isUploading,
      currentImages: formImages?.length
    });
  }, [form, carId, isUploading]);
  
  // Handle file drop/selection with retry logic
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId) {
      toast({
        variant: "destructive",
        title: "Cannot upload images",
        description: "Please save the form first before uploading images."
      });
      return;
    }
    
    if (images.length >= maxImages) {
      toast({
        variant: "warning",
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images.`
      });
      return;
    }
    
    // Start upload process - this will pause auto-save
    startUpload();
    setUploadError(null);
    
    try {
      const newImages = [...images];
      const uploadedCount = { success: 0, failed: 0 };
      
      // Process each file with retry logic
      for (let i = 0; i < acceptedFiles.length; i++) {
        if (newImages.length >= maxImages) {
          toast({
            variant: "warning",
            title: "Maximum images reached",
            description: `Only the first ${maxImages} images were uploaded.`
          });
          break;
        }
        
        const file = acceptedFiles[i];
        const fileId = `${file.name}-${file.size}`;
        const currentRetryCount = uploadRetries[fileId] || 0;
        
        // Skip if max retries reached
        if (currentRetryCount >= maxRetriesPerFile) {
          console.warn(`[ImageUploadSection] Max retries (${maxRetriesPerFile}) reached for ${file.name}, skipping`);
          uploadedCount.failed++;
          continue;
        }
        
        // Update retry count
        setUploadRetries(prev => ({
          ...prev,
          [fileId]: currentRetryCount + 1
        }));
        
        // Register the file for potential later finalization
        registerPendingFile(file);
        
        // Update progress as we process each file
        updateProgress(Math.round((i / acceptedFiles.length) * 100));
        
        console.log(`[ImageUploadSection] Uploading file ${file.name} for car ${carId} (attempt ${currentRetryCount + 1})`);
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('carId', carId);
        formData.append('type', 'additional_photos');
        
        try {
          // Upload image using our API endpoint
          const response = await fetch(`/api/upload-car-image`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            console.error(`[ImageUploadSection] Upload failed with status: ${response.status}`);
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }
          
          const data = await response.json();
          console.log(`[ImageUploadSection] Upload successful:`, data);
          
          let imageUrl: string | null = null;
          
          if (data.filePath) {
            imageUrl = data.filePath;
          } else if (data.publicUrl) {
            imageUrl = data.publicUrl;
          }
          
          // If we got a URL, add it to the images array
          if (imageUrl) {
            newImages.push(imageUrl);
            uploadedCount.success++;
          } else {
            throw new Error('No file URL returned from upload');
          }
        } catch (uploadError) {
          console.error(`[ImageUploadSection] Error uploading file ${file.name}:`, uploadError);
          
          // Try direct storage upload as fallback
          try {
            console.log(`[ImageUploadSection] Attempting direct storage upload for ${file.name}`);
            const directUrl = await uploadDirectToStorage(file, carId, 'additional_photos');
            
            if (directUrl) {
              console.log(`[ImageUploadSection] Direct upload successful for ${file.name}`);
              newImages.push(directUrl);
              uploadedCount.success++;
            } else {
              uploadedCount.failed++;
              setUploadError(`Failed to upload ${file.name}. Please try again.`);
            }
          } catch (directError) {
            console.error(`[ImageUploadSection] Direct upload also failed for ${file.name}:`, directError);
            uploadedCount.failed++;
            setUploadError(`All upload methods failed for ${file.name}. Please try again.`);
          }
        }
      }
      
      // Update local state and form values
      setImages(newImages);
      form.setValue("images", newImages, { shouldDirty: true });
      
      // Show upload summary toast
      if (uploadedCount.success > 0) {
        toast({
          variant: uploadedCount.failed > 0 ? "default" : "success",
          title: `${uploadedCount.success} image${uploadedCount.success !== 1 ? 's' : ''} uploaded`,
          description: uploadedCount.failed > 0 
            ? `${uploadedCount.failed} file${uploadedCount.failed !== 1 ? 's' : ''} failed to upload.` 
            : undefined
        });
      } else if (uploadedCount.failed > 0) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `All ${uploadedCount.failed} files failed to upload.`
        });
      }
      
      // Complete upload successfully
      finishUpload(uploadedCount.success > 0);
    } catch (error) {
      console.error('[ImageUploadSection] Error uploading images:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      finishUpload(false, error instanceof Error ? error : new Error('Upload failed'));
    }
  }, [carId, images, maxImages, startUpload, updateProgress, finishUpload, form, registerPendingFile, uploadRetries, uploadDirectToStorage]);
  
  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading || !carId || images.length >= maxImages
  });
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    form.setValue("images", newImages, { shouldDirty: true });
  };
  
  // Retry failed uploads
  const retryFailedUploads = async () => {
    setUploadError(null);
    // Reset retry counts to allow for fresh attempts
    setUploadRetries({});
  };
  
  return (
    <div className="space-y-4">
      <div>
        <FormLabel>Car Images</FormLabel>
        <p className="text-sm text-muted-foreground mb-2">
          Upload up to {maxImages} images of your car. First image will be the main image.
        </p>
      </div>
      
      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{uploadError}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryFailedUploads}
              disabled={isUploading}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {!carId && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please save the form first before uploading images.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${!carId ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-12 w-12 mx-auto text-gray-400" />
        
        {isUploading ? (
          <div className="mt-4">
            <p className="text-sm font-medium flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {isDragActive
              ? "Drop the images here"
              : !carId
              ? "Save form first to enable uploads"
              : images.length >= maxImages
              ? "Maximum number of images reached"
              : "Drag and drop images here, or click to select"}
          </p>
        )}
      </div>
      
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 border">
                {image.startsWith('http') || image.startsWith('/') ? (
                  <img
                    src={image}
                    alt={`Car image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Handle image load error
                      console.error(`[ImageUploadSection] Failed to load image: ${image}`);
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              
              {/* Main image indicator */}
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
