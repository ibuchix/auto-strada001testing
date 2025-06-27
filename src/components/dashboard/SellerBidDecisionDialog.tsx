
/**
 * Changes made:
 * - 2025-06-15: Created SellerBidDecisionDialog for accepting/declining highest bid after auction
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sellerBidDecisionService, SellerBidDecision } from "@/services/supabase/sellers";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SellerBidDecisionDialogProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  carId: string;
  auctionResultId: string | null;
  highestBid: number | null;
  highestBidDealerId: string | null;
  onDecision: (decision: SellerBidDecision) => void;
}

export const SellerBidDecisionDialog = ({
  open,
  onOpenChange,
  carId,
  auctionResultId,
  highestBid,
  highestBidDealerId,
  onDecision,
}: SellerBidDecisionDialogProps) => {
  const [loading, setLoading] = useState<"accepted" | "declined" | null>(null);

  const handleDecision = async (decision: "accepted" | "declined") => {
    setLoading(decision);
    try {
      const { data, error } = await sellerBidDecisionService.recordDecision({
        car_id: carId,
        auction_result_id: auctionResultId,
        seller_id: "", // Supabase RLS uses session, but must be set if required, else backend will reject
        decision,
        highest_bid: highestBid,
        highest_bid_dealer_id: highestBidDealerId,
      });

      if (error) {
        toast.error("Failed to submit decision", {
          description: error.message || "Please try again."
        });
      } else if (data) {
        toast.success(`Bid ${decision === "accepted" ? "accepted" : "declined"}`, {
          description: decision === "accepted"
            ? "You have accepted the highest bid. Our team will follow up for the next steps."
            : "You have declined the highest bid. Please await admin follow-up for any alternatives.",
        });
        onDecision(data);
        onOpenChange(false);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {highestBid !== null ? (
              <span>Accept or Decline Highest Bid?</span>
            ) : (
              <span>No bids received</span>
            )}
          </DialogTitle>
        </DialogHeader>
        {highestBid !== null ? (
          <>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Highest Bid:</span>{" "}
                <span className="text-lg font-semibold text-[#21CA6F]">{highestBid?.toLocaleString()} PLN</span>
              </div>
              <div className="text-xs text-muted-foreground">
                If you accept, this car will be marked sold to the top bidder. If you decline, the admin will contact you.
              </div>
            </div>
            <DialogFooter className="flex flex-row gap-2 pt-4 items-center">
              <Button
                variant="destructive"
                onClick={() => handleDecision("declined")}
                disabled={loading === "declined"}
                className="w-1/2"
              >
                {loading === "declined" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <XCircle className="mr-2 h-4 w-4" /> Decline
              </Button>
              <Button
                variant="default"
                onClick={() => handleDecision("accepted")}
                disabled={loading === "accepted"}
                className="w-1/2 bg-[#21CA6F] hover:bg-[#1DA05B] text-white"
              >
                {loading === "accepted" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 text-destructive font-medium text-center">
            No bids were received for this auction.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
