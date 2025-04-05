
/**
 * Component for the change photo button in uploaded photo cards
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 * - 2025-04-05: Enhanced with better visual styling and hover effects
 */
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ChangePhotoButtonProps {
  onClick: () => void;
}

export const ChangePhotoButton = ({ onClick }: ChangePhotoButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full bg-success/5 text-success border-success/20 hover:bg-success/10 hover:border-success/30 hover:shadow-sm font-kanit transition-all duration-300 group"
      onClick={onClick}
    >
      <RefreshCw className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-45" />
      <span>Change Photo</span>
    </Button>
  );
};

