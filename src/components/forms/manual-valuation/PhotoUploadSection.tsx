
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";
import { RequiredPhotos } from "../car-listing/photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "../car-listing/photo-upload/AdditionalPhotos";

interface PhotoUploadSectionProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, onProgressUpdate }: PhotoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const handleAdditionalPhotos = (files: File[]) => {
    files.forEach((file, index) => {
      handleFileUpload(file, `additional_${index}`);
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
    </div>
  );
};
