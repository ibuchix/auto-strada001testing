import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ImagePreview } from "./ImagePreview";
import { PhotoUploadProps } from "./types";
import { photoQualityGuidelines } from "./types";

export const PhotoUpload = ({ id, label, isUploading, onFileSelect }: PhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const checkImageQuality = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const meetsResolution = img.width >= photoQualityGuidelines.minWidth && 
                              img.height >= photoQualityGuidelines.minHeight;
        
        if (!meetsResolution) {
          toast.error(`Image resolution too low. Minimum ${photoQualityGuidelines.minWidth}x${photoQualityGuidelines.minHeight} required.`);
          resolve(false);
        }
        resolve(true);
      };
      
      img.src = objectUrl;
    });
  };

  const validateFile = async (file: File): Promise<boolean> => {
    if (!photoQualityGuidelines.acceptedFormats.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return false;
    }
    
    if (file.size > photoQualityGuidelines.maxSize) {
      toast.error("File size must be less than 5MB");
      return false;
    }

    setIsChecking(true);
    const qualityCheck = await checkImageQuality(file);
    setIsChecking(false);
    
    return qualityCheck;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateFile(file);
    if (!isValid) return;

    setSelectedFile(file);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        onFileSelect(file);
      }
    }, 200);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div className="space-y-2">
          <Input
            id={id}
            type="file"
            accept={photoQualityGuidelines.acceptedFormats.join(',')}
            disabled={isUploading || isChecking}
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {isChecking && (
            <p className="text-sm text-subtitle animate-pulse">
              Checking image quality...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ImagePreview file={selectedFile} onRemove={handleRemove} />
          {uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
        </div>
      )}
    </div>
  );
};