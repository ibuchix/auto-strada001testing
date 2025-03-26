
/**
 * Created: 2025-08-25
 * Types for dashboard components and data
 */

import { CarFeatures } from "@/types/forms";

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  soldListings: number;
  totalEarnings: number;
}

export interface DashboardListing {
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
}

export type ListingStatus = 
  | 'draft'
  | 'pending_verification'
  | 'active'
  | 'sold'
  | 'cancelled'
  | 'expired'
  | 'rejected';

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
