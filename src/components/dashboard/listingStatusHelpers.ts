
/**
 * Changes made:
 * - 2025-06-15: Created helper functions to compute dynamic listing lifecycle status for sellers.
 */

import { CarListing } from "@/types/dashboard";

/**
 * Returns user-friendly status, color, and icon for seller journey stage.
 * Considers listing/auction/bids/decisions.
 */
import {
  Clock,
  CheckCircle,
  XCircle,
  Gavel,
  AlertCircle,
  DollarSign,
  TrendingUp,
  UserCheck,
  Hourglass
} from "lucide-react";

/**
 * Compute enhanced lifecycle status for a car listing.
 */
export function getListingLifecycleStatus(listing: CarListing) {
  // If the listing is under review
  if (listing.status === "pending_review") {
    return {
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      title: "Under Review",
      description: "Your listing is being reviewed by our team"
    };
  }

  // If listing rejected
  if (listing.status === "rejected") {
    return {
      icon: XCircle,
      color: "bg-red-100 text-red-800 border-red-200",
      title: "Requires Changes",
      description: "Please review feedback and resubmit"
    };
  }

  // Live/approved but not yet to auction
  if (
    (listing.status === "available" || listing.status === "approved") &&
    (!listing.auction_status || listing.auction_status === "pending")
  ) {
    return {
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-200",
      title: "Approved & Live",
      description: "Ready and awaiting auction scheduling"
    };
  }

  // Auction is active
  if (listing.auction_status === "active") {
    // Time left
    let auctionInfo = "";
    if (listing.auction_end_time) {
      const end = new Date(listing.auction_end_time);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      if (diff > 0) {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        auctionInfo = `Auction ends in ${hrs}h ${mins}m`;
      } else {
        auctionInfo = "Auction ending soon";
      }
    }
    const bids = typeof listing.current_bid === "number" && listing.current_bid > 0
      ? `${listing.current_bid.toLocaleString()} PLN`
      : "No bids yet";
    return {
      icon: Gavel,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      title: `Live Auction${bids && bids !== "No bids yet" ? ` • ${bids}` : ""}`,
      description: auctionInfo
    };
  }

  // Auction ended, awaiting seller decision
  if (
    (listing.auction_status === "sold" || listing.status === "sold") &&
    (listing as any).awaiting_seller_decision
  ) {
    return {
      icon: AlertCircle,
      color: "bg-[#EFEFFD] text-[#4B4DED] border-[#4B4DED]",
      title: "Action Required",
      description: "Respond to the highest bid to complete this sale"
    };
  }

  // Sold
  if (listing.status === "sold" || listing.auction_status === "sold") {
    return {
      icon: DollarSign,
      color: "bg-green-100 text-green-800 border-green-200",
      title: "Sold",
      description: `Vehicle has been sold${listing.current_bid ? ` for ${listing.current_bid.toLocaleString()} PLN` : ""}`
    };
  }

  // Auction ended, not sold (reserve not met)
  if (listing.auction_status === "ended" || listing.auction_status === "unsold") {
    // If there's a current_bid vs reserve_price, show Reserve not met if needed
    let description = "Auction ended";
    if (
      typeof listing.current_bid === "number" &&
      typeof listing.reserve_price === "number"
    ) {
      if (listing.current_bid < listing.reserve_price) {
        description = "Auction ended - Reserve Not Met";
      } else {
        description = "Auction ended";
      }
    }
    return {
      icon: Hourglass,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      title: "Not Sold",
      description
    };
  }

  // Default: draft/incomplete
  return {
    icon: UserCheck,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    title: "Draft",
    description: "Complete your listing to submit for review"
  };
}

