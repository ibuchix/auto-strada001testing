
/**
 * Form Save Dialog component
 * - Shows dialog with save confirmation and last saved time
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface FormSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSaved: Date | null;
}

export const FormSaveDialog = ({
  open,
  onOpenChange,
  lastSaved
}: FormSaveDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Progress Saved</DialogTitle>
          <DialogDescription>
            Your form progress has been saved.
            {lastSaved && (
              <div className="mt-2">
                Last saved: {formatDistanceToNow(lastSaved, { addSuffix: true })}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
