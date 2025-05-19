
/**
 * Document uploader component
 * - 2024-08-25: Created initial implementation
 * - 2024-08-27: Fixed file type handling
 * - 2025-05-23: Fixed FileList vs File compatibility issue
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, File, X, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DocumentUploaderProps {
  uploadedFiles: any[];
  isUploading: boolean;
  progress: number;
  onDocumentUpload: (file: File | FileList) => Promise<string | null>;
  onRemoveUploadedFile: (fileUrl: string) => void;
}

export const DocumentUploader = ({
  uploadedFiles = [],
  isUploading,
  progress,
  onDocumentUpload,
  onRemoveUploadedFile
}: DocumentUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDocumentUpload(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDocumentUpload(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Service History Documents</h2>
      <p className="text-gray-600 mb-4">
        Upload service history documents like receipts, service books, or maintenance records.
      </p>

      <div
        className={`border-2 border-dashed rounded-md p-8 text-center ${
          dragActive ? "bg-gray-100 border-primary" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="document-file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleInputChange}
        />
        <label
          htmlFor="document-file"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-1">Drag and drop files here</p>
          <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
          <Button type="button" variant="outline" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Document"
            )}
          </Button>
        </label>
      </div>

      {isUploading && (
        <Progress value={progress} className="h-2 my-4" />
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Uploaded Documents</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.url || index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{file.name || `Document ${index + 1}`}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveUploadedFile(file.url)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
