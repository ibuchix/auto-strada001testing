
/**
 * Component for handling a single photo upload
 * Created: 2025-06-20 - Created to fix compatibility issues
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Upload, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  isRequired: boolean;
  isUploaded?: boolean;
  progress?: number;
  onFileSelect: (file: File) => Promise<string | null>;
}

export const PhotoUpload = ({
  id,
  title,
  description,
  isUploading,
  isRequired,
  isUploaded = false,
  progress = 0,
  onFileSelect
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    
    try {
      await onFileSelect(file);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    }
  };
  
  return (
    <Card className={cn(
      "transition-all duration-300 h-full",
      isUploaded ? "border-green-500 bg-green-50" : "border-gray-200",
      isRequired && !isUploaded && "border-amber-300"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {isRequired && !isUploaded && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              Required
            </span>
          )}
          {isUploaded && (
            <span className="flex items-center text-green-600 text-xs font-medium">
              <Check className="w-3 h-3 mr-1" />
              Uploaded
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {isUploaded ? (
          <div className="bg-green-100 rounded-md p-4 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        ) : (
          <>
            <div className="bg-gray-100 rounded-md p-6 flex flex-col items-center justify-center min-h-[100px]">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-xs text-center text-gray-500">
                Click to upload
              </p>
            </div>
            
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-xs">
                <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}
        
        {isUploading && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center mt-1">Uploading...</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-2">
        {!isUploaded ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isUploading}
          >
            <label
              htmlFor={`photo-upload-${id}`}
              className="w-full cursor-pointer flex items-center justify-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span>{isUploading ? "Uploading..." : "Upload"}</span>
              <input
                type="file"
                id={`photo-upload-${id}`}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-green-600"
            disabled
          >
            <Check className="w-4 h-4 mr-2" />
            Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
