
/**
 * Updated: 2024-09-08
 * Added CarListing interface for dashboard components
 */

export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  status: string;
  price: number;
  currentBid?: number;
  createdAt: string;
  created_at: string;
  features: string[];
  photos: string[];
  images: string[];
  is_draft: boolean;
  seller_id: string;
  auction_status?: string;
}

export interface DashboardStats {
  activeListings: number;
  completedAuctions: number;
  pendingAuctions: number;
  totalViews: number;
  averageSalePrice: number;
  totalSales: number;
}

export interface ActivityItem {
  id: string;
  type: 'bid' | 'message' | 'auction_end' | 'listing_created' | 'system';
  title: string;
  description: string;
  timestamp: string;
  relatedEntityId?: string;
  isRead: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  bidAlerts: boolean;
  messageAlerts: boolean;
  auctionEndAlerts: boolean;
  systemAlerts: boolean;
}
