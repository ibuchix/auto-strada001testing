import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  imageUrl?: string; // Added to support direct image URLs
}

export const ImagePreview = ({ file, onRemove, imageUrl }: ImagePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // If direct imageUrl is provided, use that
    if (imageUrl) {
      setPreview(imageUrl);
      return;
    }
    
    // Otherwise create preview from File object
    if (file.size > 0) { // Only create object URL if it's a real file with data
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      // Clean up on unmount
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [file, imageUrl]);

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
