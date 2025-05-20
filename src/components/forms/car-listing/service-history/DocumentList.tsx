
/**
 * Document List Component
 * Created: 2025-05-29
 */

import React from "react";
import { ServiceHistoryFile } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { FileIcon, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
  uploadedFiles: ServiceHistoryFile[];
  selectedFiles?: File[];
  onRemoveSelected?: (index: number) => void;
  onRemoveUploaded: (id: string) => void;
}

export const DocumentList = ({
  uploadedFiles,
  selectedFiles = [],
  onRemoveSelected,
  onRemoveUploaded,
}: DocumentListProps) => {
  // Helper function to format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to get file icon based on type
  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return <FileIcon className="h-4 w-4 text-red-500" />;
    if (type.includes('image')) return <FileIcon className="h-4 w-4 text-blue-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  // Helper function to format upload time
  const formatUploadTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (uploadedFiles.length === 0 && selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
      
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-gray-500 mb-2">Pending Uploads</h5>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                {onRemoveSelected && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onRemoveSelected(index)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <ul className="space-y-2">
          {uploadedFiles.map((file) => (
            <li key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                {getFileTypeIcon(file.type)}
                <div>
                  <span className="text-sm font-medium block truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatUploadTime(file.uploadedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View
                </a>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRemoveUploaded(file.id)}
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
