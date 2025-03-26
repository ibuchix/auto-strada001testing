
/**
 * Updated: 2025-08-26
 * Added CarListing type and fixed imports
 */

import { CarFeatures } from "@/types/forms";

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  soldListings: number;
  totalEarnings: number;
}

export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: ListingStatus;
  created_at: string;
  images: string[];
  features: CarFeatures;
  current_bid?: number;
  auction_end_time?: string;
  createdAt?: string;
  currentBid?: number;
  photos?: string[];
  is_draft?: boolean;
  seller_id?: string;
  auction_status?: AuctionStatus | null;
}

export type ListingStatus = 
  | 'draft'
  | 'pending_verification'
  | 'active'
  | 'sold'
  | 'cancelled'
  | 'expired'
  | 'rejected';

export type AuctionStatus = 
  | 'scheduled' 
  | 'active' 
  | 'ended' 
  | 'cancelled';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  details: Record<string, any>;
}

export type ActivityType = 
  | 'listing_created'
  | 'listing_published'
  | 'listing_sold'
  | 'listing_expired'
  | 'listing_cancelled'
  | 'bid_received'
  | 'auction_started'
  | 'auction_ended';
