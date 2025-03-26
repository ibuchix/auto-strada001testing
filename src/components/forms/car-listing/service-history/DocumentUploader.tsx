
/**
 * Component for uploading service history documents
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface DocumentUploaderProps {
  onUpload: (files: FileList | null) => Promise<void>;
  isUploading: boolean;
  uploadSuccess: number | null;
  uploadProgress: number;
  carId?: string;
}

export const DocumentUploader = ({ 
  onUpload, 
  isUploading, 
  uploadSuccess, 
  uploadProgress,
  carId
}: DocumentUploaderProps) => {
  
  return (
    <div className="space-y-4">
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
          onChange={(e) => onUpload(e.target.files)}
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
    </div>
  );
};
