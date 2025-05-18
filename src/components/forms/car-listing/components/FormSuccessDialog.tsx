
/**
 * Form Success Dialog component
 * - Shows dialog after successful form submission
 * - Updated: 2025-06-13 - Added auto-navigation to seller dashboard
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
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress"; 

interface FormSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId?: string;
}

export const FormSuccessDialog = ({
  open,
  onOpenChange,
  carId
}: FormSuccessDialogProps) => {
  const navigate = useNavigate();
  const [showIcon, setShowIcon] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);
  const [redirectProgress, setRedirectProgress] = useState(0);

  // Staggered animation effect
  useEffect(() => {
    if (open) {
      const iconTimer = setTimeout(() => setShowIcon(true), 100);
      const titleTimer = setTimeout(() => setShowTitle(true), 500);
      const descriptionTimer = setTimeout(() => setShowDescription(true), 900);
      const buttonsTimer = setTimeout(() => setShowButtons(true), 1300);
      
      return () => {
        clearTimeout(iconTimer);
        clearTimeout(titleTimer);
        clearTimeout(descriptionTimer);
        clearTimeout(buttonsTimer);
      };
    } else {
      setShowIcon(false);
      setShowTitle(false);
      setShowDescription(false);
      setShowButtons(false);
      setAutoRedirectSeconds(5);
      setRedirectProgress(0);
    }
  }, [open]);

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
  
  // Redirect to dashboard when countdown reaches zero
  useEffect(() => {
    if (autoRedirectSeconds === 0) {
      handleViewDashboard();
    }
  }, [autoRedirectSeconds]);

  const handleViewDashboard = () => {
    navigate("/seller-dashboard");
    onOpenChange(false);
  };

  const handleListAnotherCar = () => {
    navigate("/sellers");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <div className={`mx-auto bg-green-100 p-3 rounded-full w-fit mb-4 transition-all transform duration-500 ${showIcon ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="relative">
              <Check className="h-6 w-6 text-green-600" />
              <Sparkles className="h-4 w-4 text-green-600 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <DialogTitle className={`text-center text-xl transition-all duration-500 ${showTitle ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            Submission Successful!
          </DialogTitle>
          <DialogDescription className={`text-center transition-all duration-500 ${showDescription ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            Your car listing has been submitted successfully. Our team will review it shortly.
          </DialogDescription>
        </DialogHeader>
        
        <div className={`py-4 transition-all duration-500 ${showDescription ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <p className="text-sm text-center text-muted-foreground">
            You will receive a confirmation email with details about next steps. 
            You can view the status of your listing on your dashboard.
          </p>
          
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm font-medium">
              Redirecting to dashboard in {autoRedirectSeconds} {autoRedirectSeconds === 1 ? 'second' : 'seconds'}
            </p>
            <Progress value={redirectProgress} className="h-2" />
          </div>
        </div>
        
        <DialogFooter className={`flex flex-col sm:flex-row gap-2 transition-all duration-500 ${showButtons ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <Button 
            variant="outline" 
            onClick={handleListAnotherCar}
            className="w-full sm:w-auto group"
          >
            List Another Car
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <Button 
            onClick={handleViewDashboard}
            className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 group"
          >
            View Dashboard
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
