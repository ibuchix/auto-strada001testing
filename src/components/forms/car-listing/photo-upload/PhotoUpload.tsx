
/**
 * Changes made:
 * - 2024-07-24: Created PhotoUpload component for car listing photos
 */

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description?: string;
  isUploading?: boolean;
  progress?: number;
  isRequired?: boolean;
  diagnosticId?: string;
  isUploaded?: boolean;
  onUpload: (file: File) => Promise<string | null>;
}

export const PhotoUpload = ({
  id,
  title,
  description,
  isUploading = false,
  progress = 0,
  isRequired = false,
  diagnosticId,
  isUploaded = false,
  onUpload
}: PhotoUploadProps) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      // Log upload attempt
      console.log(`[${diagnosticId || 'upload'}] Uploading ${id}: ${file.name}`);
      
      const url = await onUpload(file);
      
      if (url) {
        setImageUrl(url);
        console.log(`[${diagnosticId || 'upload'}] Upload successful: ${url}`);
      } else {
        setUploadError("Upload failed");
        console.error(`[${diagnosticId || 'upload'}] Upload returned null`);
      }
    } catch (error: any) {
      setUploadError(error.message || "Upload failed");
      console.error(`[${diagnosticId || 'upload'}] Upload error:`, error);
    } finally {
      setUploading(false);
    }
  };
  
  // Use the prop isUploaded or internal state for the UI
  const hasUploadedImage = isUploaded || imageUrl !== null;
  
  return (
    <Card className={`overflow-hidden ${hasUploadedImage ? 'border-green-300 bg-green-50' : uploadError ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium flex items-center">
                {title}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {hasUploadedImage && <Check className="ml-1 text-green-500 h-4 w-4" />}
              </h4>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            
            {uploadError && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          {hasUploadedImage ? (
            <div className="relative">
              <img 
                src={imageUrl || '#'} 
                alt={title} 
                className="w-full h-24 object-cover rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => {
                  setImageUrl(null);
                  // You might want to call a function to remove the image on the server
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id={`file-upload-${id}`}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || uploading}
              />
              <label
                htmlFor={`file-upload-${id}`}
                className={`flex flex-col items-center justify-center w-full h-24 bg-gray-100 rounded border-2 border-dashed cursor-pointer ${
                  uploadError ? 'border-red-400' : 'border-gray-300'
                } hover:bg-gray-200 transition-colors`}
              >
                {(isUploading || uploading) ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground mt-1">Uploading...</span>
                    {progress > 0 && (
                      <Progress value={progress} className="h-1 w-20 mt-1" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">
                      {uploadError ? uploadError : "Upload photo"}
                    </span>
                  </div>
                )}
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
