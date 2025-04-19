
/**
 * Types for send-valuation-notification edge function
 * Created: 2025-04-19
 */

export interface VehicleDetails {
  make: string;
  model: string;
  year?: number;
  vin?: string;
}

export interface ValuationRequest {
  userEmail: string;
  vehicleDetails: VehicleDetails;
}

export interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: 'manual_valuation' | 'confirmation';
  related_entity_type?: string;
  related_entity_id?: string | null;
  is_read: boolean;
}
