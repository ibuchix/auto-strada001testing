
/**
 * Changes made:
 * - 2023-07-15: Created FormSuccessDialog component for displaying success message after submission
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

interface FormSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export const FormSuccessDialog = ({ open, onClose }: FormSuccessDialogProps) => {
  const navigate = useNavigate();

  const handleViewListing = () => {
    navigate("/dashboard/seller");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Listing Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Your car listing has been submitted and is now being reviewed by our team.
            You'll receive a notification once it's approved and ready for auction.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={handleViewListing} className="bg-[#DC143C] hover:bg-[#DC143C]/90">
            View My Listings
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
