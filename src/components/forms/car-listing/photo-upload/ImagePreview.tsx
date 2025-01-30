import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export const ImagePreview = ({ file, onRemove }: ImagePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(() => URL.createObjectURL(file));

  return (
    <div className="relative group">
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md hover:opacity-90 transition-opacity"
              onLoad={() => {
                // Keep the URL for the dialog
                return () => URL.revokeObjectURL(previewUrl);
              }}
            />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <img
            src={previewUrl}
            alt="Full size preview"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
      
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
