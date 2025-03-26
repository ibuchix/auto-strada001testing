
/**
 * Changes made:
 * - 2024-08-15: Added Supabase Storage integration for service document uploads
 * - 2024-08-15: Implemented document preview and file listing
 * - 2024-08-16: Fixed File constructor usage for document preview
 * - 2027-08-04: Added improved file type validation and upload feedback
 * - 2027-08-04: Enhanced upload success feedback with toast notifications
 * - 2027-08-04: Added conditional rendering for document upload based on service history type
 */

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { ImagePreview } from "./photo-upload/ImagePreview";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServiceHistorySectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

// Allowed file types for document uploads
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ServiceHistorySection = ({ form, carId }: ServiceHistorySectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];
  const serviceHistoryType = form.watch('serviceHistoryType');
  
  // Reset success indicator after 3 seconds
  useEffect(() => {
    if (uploadSuccess !== null) {
      const timer = setTimeout(() => setUploadSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload PDF, Word, or image files only"
      });
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Maximum file size is 10MB"
      });
      return false;
    }
    
    return true;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!carId) {
      toast.error("Car ID is required to upload documents");
      return;
    }

    // Filter valid files
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const newFilesArray = validFiles;
      setSelectedFiles(prev => [...prev, ...newFilesArray]);
      
      const totalFiles = newFilesArray.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      
      for (const file of newFilesArray) {
        // Create a unique file path in the service_documents folder
        const fileExt = file.name.split('.').pop();
        const filePath = `${carId}/service_documents/${uuidv4()}.${fileExt}`;
        
        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('car-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) {
          console.error('Error uploading document:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);
        
        uploadUrls.push(publicUrl);
        
        // Track document in database
        await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: file.type,
            upload_status: 'completed',
            category: 'service_document'
          });
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(newProgress);
      }
      
      // Update form with uploaded files
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      form.setValue('serviceHistoryFiles', [...currentFiles, ...uploadUrls], { 
        shouldValidate: true, 
        shouldDirty: true 
      });
      
      // Show success message with count of uploaded files
      setUploadSuccess(uploadUrls.length);
      toast.success(`${uploadUrls.length} document${uploadUrls.length > 1 ? 's' : ''} uploaded successfully`, {
        description: "Your service history documents have been added to your listing"
      });
      
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    const filesArray = [...selectedFiles];
    filesArray.splice(index, 1);
    setSelectedFiles(filesArray);
  };

  const removeUploadedFile = (url: string) => {
    const currentFiles = [...(form.getValues('serviceHistoryFiles') || [])];
    const updatedFiles = currentFiles.filter(fileUrl => fileUrl !== url);
    form.setValue('serviceHistoryFiles', updatedFiles, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
    toast.info("Document removed");
  };

  // Show the document upload section only if service history type is not "none"
  const showDocumentUpload = serviceHistoryType && serviceHistoryType !== 'none';

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-6 bg-accent/30 rounded-lg">
        <FormField
          control={form.control}
          name="serviceHistoryType"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-base font-semibold">Service History Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="full"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Full Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="partial"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Partial Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="none"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">No Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="not_due"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">First Service Not Due Yet</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {showDocumentUpload && (
          <div className="space-y-4">
            <FormLabel className="text-base font-semibold">Service History Documents</FormLabel>
            
            <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${uploadSuccess !== null ? 'border-green-500 bg-green-50' : 'hover:border-primary/50'}`}>
              {uploadSuccess !== null ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
                  <p className="mt-2 text-green-700 font-medium">
                    {uploadSuccess} document{uploadSuccess > 1 ? 's' : ''} uploaded successfully!
                  </p>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload service history documents
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: PDF, Word, JPG, PNG (Max 10MB each)
                  </p>
                </>
              )}
              <Button 
                type="button"
                variant="outline"
                className="mt-4"
                disabled={isUploading || !carId}
                onClick={() => document.getElementById('service-docs-upload')?.click()}
              >
                Select Files
              </Button>
              <input
                id="service-docs-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isUploading || !carId}
              />
            </div>
            
            {!carId && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  Please save your form progress first before uploading documents.
                </AlertDescription>
              </Alert>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-subtitle">Upload progress: {uploadProgress}%</p>
              </div>
            )}
            
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Files</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden p-4">
                      <div className="flex items-center">
                        <FileIcon className="h-6 w-6 text-gray-400 mr-2" />
                        <div className="text-sm truncate">{file.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
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
                            <FileIcon className="h-6 w-6 text-gray-400 mr-2" />
                            <div className="text-sm truncate">Document {index + 1}</div>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-2 block">
                            View PDF
                          </a>
                        </div>
                      ) : (
                        <ImagePreview 
                          file={new File([], `Document ${index + 1}`)}
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
        )}
      </div>
    </div>
  );
};
