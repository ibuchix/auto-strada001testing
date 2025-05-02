
/**
 * PhotoUploadSection Component
 * Created: 2025-06-16
 * 
 * Photo upload section for car listing form
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useDropzone } from "react-dropzone";
import { tempFileStorage } from "@/services/temp-storage/tempFileStorageService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

export const PhotoUploadSection = ({ carId }: { carId?: string }) => {
  const { form } = useFormData();
  const [uploads, setUploads] = useState<{ id: string, file: File, preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": []
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error("Some files were rejected", {
          description: "Files must be images under 5MB"
        });
      }

      if (acceptedFiles.length > 0) {
        // Process accepted files
        const newUploads = acceptedFiles.map(file => ({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file)
        }));

        // Add to uploads state
        setUploads([...uploads, ...newUploads]);
        
        // Upload to temporary storage
        setIsUploading(true);
        
        try {
          for (const upload of newUploads) {
            await tempFileStorage.addFile(upload.file, "car_photos");
          }
          
          // Update form state - we just store the previews for now
          const currentPhotos = form.getValues("uploadedPhotos") || [];
          form.setValue("uploadedPhotos", [
            ...currentPhotos,
            ...newUploads.map(u => u.preview)
          ], { shouldValidate: true });
          
          toast.success(`${acceptedFiles.length} photo(s) added`);
        } catch (error) {
          console.error("Error uploading files:", error);
          toast.error("Error uploading files", {
            description: "Please try again or try with fewer files"
          });
        } finally {
          setIsUploading(false);
        }
      }
    }
  });

  const removePhoto = (index: number) => {
    const currentUploads = [...uploads];
    const uploadToRemove = currentUploads[index];
    
    if (uploadToRemove) {
      // Remove from temporary storage
      tempFileStorage.removeFileByName(uploadToRemove.file.name);
      
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(uploadToRemove.preview);
      
      // Update uploads state
      currentUploads.splice(index, 1);
      setUploads(currentUploads);
      
      // Update form state
      const currentPhotos = form.getValues("uploadedPhotos") || [];
      currentPhotos.splice(index, 1);
      form.setValue("uploadedPhotos", currentPhotos, { shouldValidate: true });
      
      toast.info("Photo removed");
    }
  };

  // Cleanup object URLs when component unmounts
  useState(() => {
    return () => {
      uploads.forEach(upload => URL.revokeObjectURL(upload.preview));
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Photos</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Photos</CardTitle>
          <CardDescription>
            Add photos of your vehicle. Clear, well-lit photos from different angles will help buyers see your car better.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="uploadedPhotos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Photos</FormLabel>
                
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer ${
                    isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    {isDragActive ? (
                      <p>Drop the files here...</p>
                    ) : (
                      <p>Drag and drop photos here, or click to select files</p>
                    )}
                    <p className="text-sm text-gray-500">
                      JPG, PNG or WebP, up to 5MB each
                    </p>
                  </div>
                </div>
                
                <FormMessage />
                
                {isUploading && (
                  <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center">
                    <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    <span>Uploading photos...</span>
                  </div>
                )}
                
                {uploads.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploads.map((upload, index) => (
                      <div key={upload.id} className="relative group">
                        <img
                          src={upload.preview}
                          alt={`Vehicle photo ${index + 1}`}
                          className="h-40 w-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
