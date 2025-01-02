import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  if (progress === 0 || progress === 100) return null;

  return (
    <div className="mt-4">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-subtitle mt-2">Upload progress: {Math.round(progress)}%</p>
    </div>
  );
};