
/**
 * Component for the change photo button in uploaded photo cards
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
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
      className="w-full bg-success/5 text-success border-success/20 hover:bg-success/10 font-kanit"
      onClick={onClick}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      <span>Change Photo</span>
    </Button>
  );
};
