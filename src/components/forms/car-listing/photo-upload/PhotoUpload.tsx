import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ImagePreview } from "./ImagePreview";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface PhotoUploadProps {
  id: string;
  label?: string;
  title?: string; // Added to match props from RequiredPhotos
  description?: string; // Added to match props from RequiredPhotos
  isUploading: boolean;
  isUploaded?: boolean;
  progress?: number;
  onFileSelect?: (file: File) => void;
  onUpload?: (file: File) => Promise<string | null>; // Updated to match the expected return type
  disabled?: boolean;
}

export const PhotoUpload = ({ 
  id, 
  label,
  title,
  description,
  isUploading, 
  isUploaded = false,
  progress = 0,
  onFileSelect,
  onUpload,
  disabled = false 
}: PhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      return false;
    }
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      
      // If we have an onUpload function, use it
      if (onUpload) {
        try {
          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
            }
          }, 200);
          
          await onUpload(file);
          clearInterval(interval);
          setUploadProgress(100);
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Failed to upload file');
        }
      } else if (onFileSelect) {
        // Otherwise, just pass the file to parent
        onFileSelect(file);
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Use label or title as the display text
  const displayLabel = label || title || "Upload Photo";

  return (
    <div className="space-y-4">
      <Label htmlFor={id}>{displayLabel}</Label>
      {description && <p className="text-xs text-subtitle">{description}</p>}
      
      {!selectedFile && !isUploaded ? (
        <Input
          id={id}
          type="file"
          accept="image/*"
          disabled={isUploading || disabled}
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      ) : (
        <div className="space-y-4">
          <ImagePreview file={selectedFile || new File([], "placeholder")} onRemove={handleRemove} />
          {(uploadProgress < 100 || (progress && progress < 100)) && (
            <Progress value={uploadProgress || progress} className="w-full" />
          )}
        </div>
      )}
    </div>
  );
};
