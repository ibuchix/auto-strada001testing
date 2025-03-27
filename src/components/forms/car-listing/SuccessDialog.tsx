
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSaved?: Date | null;
  carId?: string;
}

export const SuccessDialog = ({ 
  open, 
  onOpenChange,
  lastSaved,
  carId
}: SuccessDialogProps) => {
  const navigate = useNavigate();

  const handleViewListing = () => {
    if (carId) {
      navigate(`/dashboard/listing/${carId}`);
    } else {
      navigate("/dashboard");
    }
    onOpenChange(false);
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
            <p className="mb-4 text-base">
              Thank you for submitting your vehicle listing. Our team will review your information.
            </p>
            {lastSaved && (
              <p className="text-sm text-subtitle mb-2">
                Submitted on: {format(lastSaved, 'PPP p')}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button 
                className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
                onClick={handleViewListing}
              >
                View Listing
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/dashboard');
                }}
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
