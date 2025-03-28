
/**
 * Component for displaying uploaded service history documents
 * - 2025-11-05: Updated to handle both string and object types for files
 */
import { File as FileIcon, X } from "lucide-react";
import { ImagePreview } from "../photo-upload/ImagePreview";
import { ServiceHistoryFile } from "@/types/forms";

interface DocumentListProps {
  selectedFiles: File[];
  uploadedFiles: (string | ServiceHistoryFile)[];
  onRemoveSelected: (index: number) => void;
  onRemoveUploaded: (fileId: string) => void;
}

export const DocumentList = ({ 
  selectedFiles, 
  uploadedFiles, 
  onRemoveSelected, 
  onRemoveUploaded 
}: DocumentListProps) => {
  
  if (selectedFiles.length === 0 && uploadedFiles.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Selected Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative border rounded-md overflow-hidden p-4">
                <div className="flex items-center">
                  <FileIcon className="h-6 w-6 text-gray-400 mr-2" />
                  <div className="text-sm truncate">{file.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSelected(index)}
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
        <div>
          <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => {
              // Handle both string and object types
              const fileUrl = typeof file === 'string' ? file : file.url;
              const fileName = typeof file === 'string' ? `Document ${index + 1}` : file.name;
              const fileId = typeof file === 'string' ? file : file.id;
              
              return (
                <div key={index} className="relative">
                  {fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="border rounded-md overflow-hidden p-4">
                      <div className="flex items-center">
                        <FileIcon className="h-6 w-6 text-gray-400 mr-2" />
                        <div className="text-sm truncate">{fileName}</div>
                      </div>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-2 block">
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <ImagePreview 
                      file={new File([], fileName)}
                      onRemove={() => onRemoveUploaded(fileId)}
                      imageUrl={fileUrl}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveUploaded(fileId)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

