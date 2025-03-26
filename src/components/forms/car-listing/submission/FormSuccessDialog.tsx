
/**
 * Changes made:
 * - 2024-06-07: Created FormSuccessDialog to show after successful form submission
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

interface FormSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export const FormSuccessDialog = ({ 
  open, 
  onClose 
}: FormSuccessDialogProps) => {
  const navigate = useNavigate();

  const handleViewDashboard = () => {
    navigate("/seller-dashboard");
    onClose();
  };

  const handleListAnotherCar = () => {
    navigate("/sellers");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">Submission Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your car listing has been submitted successfully. Our team will review it shortly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-center text-muted-foreground">
            You will receive a confirmation email with details about next steps. 
            You can view the status of your listing on your dashboard.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleListAnotherCar}
            className="w-full sm:w-auto"
          >
            List Another Car
          </Button>
          <Button 
            onClick={handleViewDashboard}
            className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            View Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
