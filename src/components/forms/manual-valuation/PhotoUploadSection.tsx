
/**
 * Changes made:
 * - 2024-08-15: Added service history document upload functionality
 * - 2024-08-15: Improved file selection and preview UI
 */

import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, File, UploadCloud, X } from "lucide-react";
import { RequiredPhotos } from "../car-listing/photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "../car-listing/photo-upload/AdditionalPhotos";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { ImagePreview } from "../car-listing/photo-upload/ImagePreview";

interface PhotoUploadSectionProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, onProgressUpdate }: PhotoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Create unique file path with type-based organization
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      // Upload to the car-images bucket with proper categorization
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      setProgress(100);
      if (onProgressUpdate) onProgressUpdate(100);

      // Update form data with the uploaded file path
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...currentPhotos, publicUrl]);

      toast.success(`Photo uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const newDocuments = Array.from(files);
      setSelectedDocuments(prev => [...prev, ...newDocuments]);
      
      const totalFiles = newDocuments.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      
      for (const file of newDocuments) {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `valuation/service_documents/${uuidv4()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error('Error uploading document:', uploadError);
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(fileName);
          
        uploadUrls.push(publicUrl);
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setProgress(newProgress);
        if (onProgressUpdate) onProgressUpdate(newProgress);
      }
      
      // Update form
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      form.setValue('serviceHistoryFiles', [...currentFiles, ...uploadUrls], {
        shouldValidate: true,
        shouldDirty: true
      });
      
      toast.success(`${uploadUrls.length} document(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleAdditionalPhotos = (files: File[]) => {
    files.forEach((file, index) => {
      handleFileUpload(file, `additional_${index}`);
    });
  };
  
  const removeDocument = (index: number) => {
    const docsArray = [...selectedDocuments];
    docsArray.splice(index, 1);
    setSelectedDocuments(docsArray);
  };
  
  const removeUploadedFile = (url: string) => {
    const currentFiles = [...(form.getValues('serviceHistoryFiles') || [])];
    const updatedFiles = currentFiles.filter(fileUrl => fileUrl !== url);
    form.setValue('serviceHistoryFiles', updatedFiles, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Photos</h2>

      <Alert className="mb-4 border-secondary/20 bg-secondary/5">
        <Camera className="h-4 w-4 text-secondary" />
        <AlertDescription className="ml-2">
          Please provide clear, well-lit photos of your vehicle. Include all angles of the exterior
          and key interior features. This helps us provide the most accurate valuation.
        </AlertDescription>
      </Alert>

      <RequiredPhotos
        isUploading={isUploading}
        onFileSelect={handleFileUpload}
        progress={progress}
      />

      <AdditionalPhotos
        isUploading={isUploading}
        onFilesSelect={handleAdditionalPhotos}
      />

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-subtitle">Upload progress: {Math.round(progress)}%</p>
        </div>
      )}
      
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-semibold">Service History Documents</h3>
        
        <Alert className="mb-4 border-secondary/20 bg-secondary/5">
          <File className="h-4 w-4 text-secondary" />
          <AlertDescription className="ml-2">
            Upload any service records, maintenance history, or other documentation that verifies the vehicle's service history.
          </AlertDescription>
        </Alert>
        
        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50">
          <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Upload service history documents
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports: PDF, JPG, PNG (Max 10MB each)
          </p>
          <Button 
            type="button"
            variant="outline"
            className="mt-4"
            disabled={isUploading}
            onClick={() => document.getElementById('service-docs-upload-valuation')?.click()}
          >
            Select Files
          </Button>
          <input
            id="service-docs-upload-valuation"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={(e) => handleDocumentUpload(e.target.files)}
            disabled={isUploading}
          />
        </div>
        
        {selectedDocuments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Documents</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedDocuments.map((file, index) => (
                <div key={index} className="relative border rounded-md overflow-hidden p-4">
                  <div className="flex items-center">
                    <File className="h-6 w-6 text-gray-400 mr-2" />
                    <div className="text-sm truncate">{file.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedFiles.map((url, index) => (
                <div key={index} className="relative">
                  {url.toLowerCase().endsWith('.pdf') ? (
                    <div className="border rounded-md overflow-hidden p-4">
                      <div className="flex items-center">
                        <File className="h-6 w-6 text-gray-400 mr-2" />
                        <div className="text-sm truncate">Document {index + 1}</div>
                      </div>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-2 block">
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <ImagePreview 
                      file={new File([], `Document ${index + 1}`, { type: 'image/jpeg' })}
                      onRemove={() => removeUploadedFile(url)}
                      imageUrl={url}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(url)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
