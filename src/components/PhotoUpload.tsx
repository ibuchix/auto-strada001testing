
/**
 * Reusable photo upload component
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, CheckCircle2, AlertCircle } from "lucide-react";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  isUploaded?: boolean;
  progress?: number;
  isRequired?: boolean;
  disabled?: boolean;
  diagnosticId?: string;
  onUpload: (file: File) => Promise<string | null>;
}

export const PhotoUpload = ({ 
  id, 
  title, 
  description, 
  isUploading, 
  isUploaded = false,
  progress = 0, 
  isRequired = false,
  disabled = false,
  diagnosticId,
  onUpload 
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    if (diagnosticId) {
      console.log(`[${diagnosticId}] Starting upload for ${id}:`, file.name);
    }

    try {
      const result = await onUpload(file);
      
      if (!result) {
        setError("Upload failed");
        if (diagnosticId) {
          console.error(`[${diagnosticId}] Upload failed for ${id}`);
        }
      } else if (diagnosticId) {
        console.log(`[${diagnosticId}] Upload successful for ${id}:`, result);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
      if (diagnosticId) {
        console.error(`[${diagnosticId}] Upload error for ${id}:`, err);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!isUploading && !disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className={`overflow-hidden ${isUploaded ? 'border-green-500' : ''}`}>
      <CardContent className="p-3">
        <div className="aspect-square flex flex-col items-center justify-center text-center gap-2 relative">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || disabled}
          />
          
          {isUploaded ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
              <h3 className="font-medium">{title}</h3>
              <p className="text-xs text-green-700">Uploaded</p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-full flex flex-col gap-2 rounded-sm hover:bg-muted"
              onClick={handleClick}
              disabled={isUploading || disabled}
            >
              {error ? (
                <AlertCircle className="h-10 w-10 text-destructive" />
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
                {isRequired && <span className="text-xs text-red-500 block mt-1">Required</span>}
                {error && <span className="text-xs text-red-500 block mt-1">{error}</span>}
              </div>
              <div className="mt-auto">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs ml-1">Upload</span>
              </div>
            </Button>
          )}

          {(uploading || isUploading) && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
              <Progress value={progress} className="w-4/5 mb-2" />
              <p className="text-xs">Uploading... {progress}%</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;
