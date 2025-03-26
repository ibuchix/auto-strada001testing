
/**
 * Component for service document uploads
 */
import { Button } from "@/components/ui/button";
import { FileIcon, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ImagePreview } from "../../car-listing/photo-upload/ImagePreview";

interface DocumentUploaderProps {
  uploadedFiles: string[];
  isUploading: boolean;
  progress: number;
  onDocumentUpload: (files: FileList | null) => Promise<void>;
  onRemoveUploadedFile: (url: string) => void;
}

export const DocumentUploader = ({
  uploadedFiles,
  isUploading,
  progress,
  onDocumentUpload,
  onRemoveUploadedFile
}: DocumentUploaderProps) => {
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  
  const removeDocument = (index: number) => {
    const docsArray = [...selectedDocuments];
    docsArray.splice(index, 1);
    setSelectedDocuments(docsArray);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Service History Documents</h3>
      
      <Alert className="mb-4 border-secondary/20 bg-secondary/5">
        <FileIcon className="h-4 w-4 text-secondary" />
        <AlertDescription className="ml-2">
          Upload any service records, maintenance history, or other documentation that verifies the vehicle's service history.
        </AlertDescription>
      </Alert>
      
      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50">
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Upload service history documents
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports: PDF, JPG, PNG (Max 10MB each)
        </p>
        <Button 
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isUploading}
          onClick={() => document.getElementById('service-docs-upload-valuation')?.click()}
        >
          Select Files
        </Button>
        <input
          id="service-docs-upload-valuation"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => onDocumentUpload(e.target.files)}
          disabled={isUploading}
        />
      </div>
      
      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-subtitle">Upload progress: {Math.round(progress)}%</p>
        </div>
      )}
      
      {selectedDocuments.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Documents</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedDocuments.map((file, index) => (
              <div key={index} className="relative border rounded-md overflow-hidden p-4">
                <div className="flex items-center">
                  <FileIcon className="h-6 w-6 text-gray-400 mr-2" />
                  <div className="text-sm truncate">{file.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
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
                    onRemove={() => onRemoveUploadedFile(url)}
                    imageUrl={url}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveUploadedFile(url)}
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
  );
};
