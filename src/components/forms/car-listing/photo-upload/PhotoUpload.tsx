import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoUploadProps } from "./types";

export const PhotoUpload = ({ id, label, isUploading, onFileSelect }: PhotoUploadProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept="image/*"
        disabled={isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
};