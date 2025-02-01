import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export const SuccessDialog = ({ open, onOpenChange, onClose }: SuccessDialogProps) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard/seller');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-oswald">
            <CheckCircle2 className="h-6 w-6 text-[#21CA6F]" />
            Listing Submitted Successfully
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            <div className="space-y-4">
              <p className="text-base text-subtitle">
                Your car listing has been submitted and is currently under review by our team.
              </p>
              <div className="bg-[#EFEFFD] p-4 rounded-lg">
                <p className="text-sm text-subtitle">
                  We will carefully review your listing details to ensure everything meets our quality standards. 
                  You will receive a notification once your listing is approved and live on our platform. 
                  If any changes are needed, we'll contact you directly.
                </p>
              </div>
              <Button 
                className="mt-6 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto"
                onClick={handleClose}
              >
                Go to Dashboard
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};