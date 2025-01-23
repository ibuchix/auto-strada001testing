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
            Valuation Request Submitted
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            <p className="mb-4 text-base">
              Thank you for submitting your vehicle for valuation. Our expert team will carefully review your information.
            </p>
            <p className="text-sm text-subtitle mb-4">
              You will receive your detailed valuation report within 24-48 hours via email.
            </p>
            <Button 
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto"
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard');
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