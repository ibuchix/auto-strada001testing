
/**
 * Changes made:
 * - Added reference to saving functionality for resuming later
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
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              className="h-6 w-6 text-green-600"
              aria-hidden="true"
            />
          </div>
          <DialogTitle className="text-center mt-4">Form Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Your car listing form has been submitted and is now waiting for review. You'll be notified when it's approved.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-gray-600 my-4 bg-gray-50 p-4 rounded-lg">
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

        <DialogFooter className="sm:justify-center gap-3">
          {carId && (
            <Button asChild variant="outline">
              <Link to={`/dashboard/seller/listings/${carId}`}>
                View Listing
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/dashboard/seller">Go to Dashboard</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
