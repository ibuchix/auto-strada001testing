
/**
 * Component for displaying uploaded service history documents
 */
import { File as FileIcon, X } from "lucide-react";
import { ImagePreview } from "../photo-upload/ImagePreview";

interface DocumentListProps {
  selectedFiles: File[];
  uploadedFiles: string[];
  onRemoveSelected: (index: number) => void;
  onRemoveUploaded: (url: string) => void;
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
                    onRemove={() => onRemoveUploaded(url)}
                    imageUrl={url}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveUploaded(url)}
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
