
/**
 * SaveProgressDialog Component
 * Displays information when a user saves progress to continue later
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
import { Bookmark, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

interface SaveProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
}

export const SaveProgressDialog = ({
  open,
  onOpenChange,
  draftId
}: SaveProgressDialogProps) => {
  const [copied, setCopied] = useState(false);
  
  const continuationLink = draftId 
    ? `${window.location.origin}/sell-my-car?draft=${draftId}` 
    : `${window.location.origin}/dashboard/seller`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(continuationLink)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Bookmark
              className="h-6 w-6 text-blue-600"
              aria-hidden="true"
            />
          </div>
          <DialogTitle className="text-center mt-4">Progress Saved!</DialogTitle>
          <DialogDescription className="text-center">
            Your listing information has been saved. You can continue editing later from your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-gray-600 my-4">
          <p className="mb-2">
            <strong>You can access your draft in two ways:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>From your seller dashboard under "Draft Listings"</li>
            <li>
              <span>By using this direct link:</span>
              <div className="flex items-center mt-2 bg-gray-50 p-2 rounded border">
                <code className="text-xs flex-1 truncate">{continuationLink}</code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-2" 
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <span className="text-green-600 text-xs">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">
            Your progress is automatically saved regularly, but using the "Save & Continue Later" button ensures all data is preserved.
          </p>
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          <Button asChild variant="outline">
            <a href={continuationLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Direct Link
            </a>
          </Button>
          <Button asChild>
            <Link to="/dashboard/seller">Go to Dashboard</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
