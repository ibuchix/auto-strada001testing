import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuccessDialog = ({ open, onOpenChange }: SuccessDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-oswald">
            <CheckCircle2 className="h-6 w-6 text-[#21CA6F]" />
            Listing Submitted Successfully
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            <p className="mb-4 text-base">
              Your car listing has been submitted and is pending review. Our team will review your listing within 24 hours.
            </p>
            <p className="text-sm text-subtitle">
              You will receive a notification once your listing is live.
            </p>
            <Button 
              className="mt-6 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto"
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard/seller');
              }}
            >
              Go to Dashboard
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};