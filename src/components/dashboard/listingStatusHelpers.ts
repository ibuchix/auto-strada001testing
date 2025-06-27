
/**
 * Changes made:
 * - 2025-06-15: Created helper functions to compute dynamic listing lifecycle status for sellers.
 * - 2025-06-15: Updated to support auction_scheduled logic for seller approval & scheduling clarity.
 */

import { CarListing } from "@/types/dashboard";

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
 * Handles new auction_scheduled field for waiting/approval vs scheduled clarity.
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

  // Approval/scheduling split — use auction_scheduled boolean
  if (listing.status === "available") {
    // Not scheduled yet: waiting for auction schedule; approved by admin but not scheduled by auction ops
    if (!listing.auction_scheduled) {
      return {
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        title: "Waiting for Approval",
        description: "Awaiting auction team to schedule your listing"
      };
    }
    // Scheduled for auction but auction not started yet
    if (listing.auction_scheduled && (!listing.auction_status || listing.auction_status === "pending")) {
      return {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
        title: "Approved & Live",
        description: "Auction date scheduled, pending auction start"
      };
    }
  }

  // Auction is active
  if (listing.auction_status === "active") {
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
