
/**
 * Common photo upload component with progress and error handling
 */

import { useState } from "react";
import { Upload, X, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  isUploaded?: boolean;
  progress?: number;
  isRequired?: boolean;
  diagnosticId?: string;
  disabled?: boolean;
  onUpload: (file: File) => Promise<string>;
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
  onUpload,
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileSelected(file);
    setError(null);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      await onUpload(file);
    } catch (error: any) {
      console.error("File upload error:", error);
      setError(error.message || "Failed to upload image");
    }
  };

  const statusIndicator = () => {
    if (isUploaded) {
      return (
        <div className="flex items-center text-green-600 gap-1">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Uploaded</span>
        </div>
      );
    }

    if (isUploading) {
      return (
        <div className="w-full">
          <Progress value={progress} className="h-2 mb-1" />
          <p className="text-xs text-subtitle">{Math.round(progress)}% complete</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center text-red-600 gap-1">
          <X className="h-5 w-5" />
          <span className="text-sm font-medium">Error: {error}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`overflow-hidden ${isUploaded ? 'border-green-300 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <h3 className="text-base font-medium flex items-center gap-2">
              {title}
              {isRequired && <span className="text-red-500">*</span>}
            </h3>
            <p className="text-sm text-subtitle mt-1">{description}</p>
            {statusIndicator()}
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <input
                type="file"
                id={id}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isUploading || disabled}
              />
              <Button
                type="button"
                variant={isUploaded ? "outline" : "default"}
                size="sm"
                className={isUploaded ? "border-green-500 text-green-600" : ""}
                disabled={isUploading || disabled}
              >
                {isUploaded ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Replace
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
