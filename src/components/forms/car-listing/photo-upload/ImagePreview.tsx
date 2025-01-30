import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export const ImagePreview = ({ file, onRemove }: ImagePreviewProps) => {
  const previewUrl = URL.createObjectURL(file);

  return (
    <div className="relative group">
      <img
        src={previewUrl}
        alt="Preview"
        className="w-full h-48 object-cover rounded-md"
        onLoad={() => URL.revokeObjectURL(previewUrl)}
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};