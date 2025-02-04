import { Progress } from "@/components/ui/progress";

interface FormProgressProps {
  progress: number;
}

export const FormProgress = ({ progress }: FormProgressProps) => {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex justify-between text-sm text-subtitle">
        <span>Form Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-accent"
      />
    </div>
  );
};