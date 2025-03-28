
/**
 * Changes made:
 * - Added reference to saving functionality for resuming later
 * - 2028-06-15: Added micro-interactions for success dialog
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
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSaved: Date | null;
  carId?: string;
}

export const SuccessDialog = ({
  open,
  onOpenChange,
  lastSaved,
  carId
}: SuccessDialogProps) => {
  const [showIcon, setShowIcon] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Staggered animation effect
  useEffect(() => {
    if (open) {
      const iconTimer = setTimeout(() => setShowIcon(true), 100);
      const titleTimer = setTimeout(() => setShowTitle(true), 400);
      const descriptionTimer = setTimeout(() => setShowDescription(true), 700);
      const contentTimer = setTimeout(() => setShowContent(true), 1000);
      const buttonsTimer = setTimeout(() => setShowButtons(true), 1300);
      
      return () => {
        clearTimeout(iconTimer);
        clearTimeout(titleTimer);
        clearTimeout(descriptionTimer);
        clearTimeout(contentTimer);
        clearTimeout(buttonsTimer);
      };
    } else {
      setShowIcon(false);
      setShowTitle(false);
      setShowDescription(false);
      setShowContent(false);
      setShowButtons(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 transition-all transform duration-500 ${showIcon ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="relative">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <Sparkles className="h-4 w-4 text-green-600 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <DialogTitle className={`text-center mt-4 transition-all duration-500 ${showTitle ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            Form Submitted Successfully!
          </DialogTitle>
          <DialogDescription className={`text-center transition-all duration-500 ${showDescription ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            Your car listing form has been submitted and is now waiting for review. You'll be notified when it's approved.
          </DialogDescription>
        </DialogHeader>

        <div className={`text-sm text-gray-600 my-4 bg-gray-50 p-4 rounded-lg transition-all duration-500 ${showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <p className="mb-2">
            <strong>Next steps:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Our team will review your listing</li>
            <li>You'll receive notification when approved</li>
            <li>You can track status in your dashboard</li>
            <li>You can edit your listing at any time</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Need to make changes? Use the Save & Continue Later feature to resume editing anytime.
          </p>
        </div>

        <DialogFooter className={`sm:justify-center gap-3 transition-all duration-500 ${showButtons ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          {carId && (
            <Button asChild variant="outline" className="group">
              <Link to={`/dashboard/seller/listings/${carId}`}>
                View Listing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
          <Button asChild className="bg-[#DC143C] hover:bg-[#DC143C]/90 group">
            <Link to="/dashboard/seller">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
