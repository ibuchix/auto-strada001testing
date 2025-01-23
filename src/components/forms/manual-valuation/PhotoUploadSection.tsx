import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";

interface PhotoUploadSectionProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, onProgressUpdate }: PhotoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (files: FileList | null, type: 'exterior' | 'interior') => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const uploads = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${type}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('manual-valuation-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const progress = ((index + 1) / files.length) * 100;
        setProgress(progress);
        if (onProgressUpdate) onProgressUpdate(progress);

        return filePath;
      });

      await Promise.all(uploads);
      toast.success(`${type} photos uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="exteriorPhotos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exterior Photos</FormLabel>
              <div className="space-y-2">
                <p className="text-sm text-subtitle">
                  Include front, back, sides, and any damage
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={(e) => {
                    handleFileUpload(e.target.files, 'exterior');
                    field.onChange(e.target.files);
                  }}
                />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interiorPhotos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interior Photos</FormLabel>
              <div className="space-y-2">
                <p className="text-sm text-subtitle">
                  Include dashboard, seats, and any notable features
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={(e) => {
                    handleFileUpload(e.target.files, 'interior');
                    field.onChange(e.target.files);
                  }}
                />
              </div>
            </FormItem>
          )}
        />
      </div>

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-subtitle">Upload progress: {Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};