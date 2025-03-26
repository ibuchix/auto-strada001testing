
/**
 * Changes made:
 * - 2028-07-14: Created FormSuccessDialog component for displaying submission success
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export const FormSuccessDialog = ({ open, onClose }: FormSuccessDialogProps) => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/dashboard/seller');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto my-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">Listing Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Your listing has been submitted for review. Our team will verify the details and make it live soon.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            You'll receive a notification once your listing is approved and live on the platform.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Create Another Listing
          </Button>
          <Button 
            onClick={handleGoToDashboard}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
