
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuccessDialog = ({ open, onOpenChange }: SuccessDialogProps) => {
  const navigate = useNavigate();
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);
  const [redirectProgress, setRedirectProgress] = useState(0);

  // Auto-redirect countdown timer
  useEffect(() => {
    if (!open || autoRedirectSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        const newValue = prev - 1;
        setRedirectProgress(((5 - newValue) / 5) * 100);
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [open, autoRedirectSeconds]);
  
  // Reset timer when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAutoRedirectSeconds(5);
      setRedirectProgress(0);
    }
  }, [open]);
  
  // Redirect to dashboard when countdown reaches zero
  useEffect(() => {
    if (autoRedirectSeconds === 0) {
      handleGoToDashboard();
    }
  }, [autoRedirectSeconds]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
    onOpenChange(false);
  };

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
            
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">
                Redirecting to dashboard in {autoRedirectSeconds} {autoRedirectSeconds === 1 ? 'second' : 'seconds'}
              </p>
              <Progress value={redirectProgress} className="h-2" />
            </div>
            
            <Button 
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto mt-4 group"
              onClick={handleGoToDashboard}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
