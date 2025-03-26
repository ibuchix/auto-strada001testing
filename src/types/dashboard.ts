
/**
 * Changes made:
 * - 2024-08-04: Fixed import for CarFeatures type
 */

import { CarFeatures } from "@/types/forms";

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalEarnings: number;
  averageSalePrice: number;
}

export interface RecentActivity {
  id: string;
  type: 'listing_created' | 'listing_sold' | 'bid_received' | 'system_message';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface DashboardListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  status: string;
  price: number;
  currentBid?: number | null;
  thumbnailUrl?: string;
  createdAt: string;
  features: CarFeatures;
  auctionStatus?: string;
  auctionEndTime?: string;
}

export interface DashboardBid {
  id: string;
  carId: string;
  amount: number;
  status: 'active' | 'outbid' | 'won' | 'lost';
  timestamp: string;
  carTitle: string;
  carThumbnail?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  listings: DashboardListing[];
}
