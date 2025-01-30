import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";

interface PhotosStepProps {
  formData: any;
  onUpdate: (data: any) => void;
}

export const PhotosStep = ({ formData, onUpdate }: PhotosStepProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onUpdate({ photos: files });
  };

  return (
    <div className="space-y-6">
      <Alert className="mb-4 border-secondary/20 bg-secondary/5">
        <Camera className="h-4 w-4 text-secondary" />
        <AlertDescription className="ml-2">
          Please provide clear, well-lit photos of your vehicle. Include all angles
          of the exterior and key interior features.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label>Upload Photos</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};