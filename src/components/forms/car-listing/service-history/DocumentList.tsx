
/**
 * Document List Component
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 */

import { ServiceHistoryFile } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";

interface DocumentListProps {
  selectedFiles: File[];
  uploadedFiles: ServiceHistoryFile[];
  onRemoveSelected: (index: number) => void;
  onRemoveUploaded: (id: string) => void;
}

export const DocumentList = ({
  selectedFiles,
  uploadedFiles,
  onRemoveSelected,
  onRemoveUploaded
}: DocumentListProps) => {
  if (selectedFiles.length === 0 && uploadedFiles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="grid grid-cols-1 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 text-sm font-medium truncate">{file.name}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveSelected(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 text-sm font-medium truncate">{file.name}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveUploaded(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
