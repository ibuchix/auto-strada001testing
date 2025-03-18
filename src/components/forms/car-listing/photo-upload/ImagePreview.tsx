
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export const ImagePreview = ({ file, onRemove }: ImagePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Create the preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Clean up on unmount
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div className="relative border rounded-md overflow-hidden">
      {preview && (
        <img 
          src={preview} 
          alt="Preview"
          className="w-full h-40 object-cover"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
        aria-label="Remove image"
      >
        <X className="h-4 w-4 text-gray-700" />
      </button>
      <div className="text-xs p-2 bg-gray-50 border-t">
        {file.name}
      </div>
    </div>
  );
};
