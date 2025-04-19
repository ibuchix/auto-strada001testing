
/**
 * Services for send-valuation-notification edge function
 * Created: 2025-04-19
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation, logError } from './utils.ts';
import { NotificationPayload, ValuationRequest } from './types.ts';

export class NotificationService {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase.auth.admin.getUserByEmail(email);
    if (error) throw new Error(`Error fetching user: ${error.message}`);
    return data.user;
  }

  async createNotification(notification: NotificationPayload) {
    const { error } = await this.supabase
      .from('notifications')
      .insert(notification);
    
    if (error) throw new Error(`Error creating notification: ${error.message}`);
  }

  async handleValuationRequest(request: ValuationRequest) {
    const requestId = crypto.randomUUID();
    logOperation('handle_valuation_request_start', { requestId });

    try {
      const user = await this.getUserByEmail(request.userEmail);

      // Create admin notification
      await this.createNotification({
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'New Manual Valuation Request',
        message: `${request.vehicleDetails.make} ${request.vehicleDetails.model} ${
          request.vehicleDetails.year ? `(${request.vehicleDetails.year})` : ''
        } requested by ${request.userEmail}`,
        type: 'manual_valuation',
        related_entity_type: 'manual_valuation',
        related_entity_id: null,
        is_read: false
      });

      // Create user confirmation notification if user exists
      if (user?.id) {
        await this.createNotification({
          user_id: user.id,
          title: 'Manual Valuation Request Received',
          message: `We've received your valuation request for your ${request.vehicleDetails.make} ${request.vehicleDetails.model}. Our team will review and respond within 24-48 hours.`,
          type: 'confirmation',
          is_read: false
        });
      }

      logOperation('handle_valuation_request_complete', { requestId, success: true });
    } catch (error) {
      logError('handle_valuation_request', error, { requestId });
      throw error;
    }
  }
}
