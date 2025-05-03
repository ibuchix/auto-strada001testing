
/**
 * Form submission service
 * Created: 2025-04-12
 * Updated: 2025-07-03 - Refactored for better error handling and modularity
 * Updated: 2025-07-27 - Fixed error category typing issues
 */

import { CarListingFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';
import { AppError } from '@/errors/classes';
import { ErrorCode, ErrorSeverity } from '@/errors/types';
import { ValidationSubmissionError } from '../errors';

// Define error category types compatible with AppError
type ErrorCategory = 'validation_error' | 'technical_error' | 'business_error' | 'auth_error' | 'network_error';

export const submissionService = {
  submitFormData: async (
    formData: CarListingFormData,
    userId: string
  ): Promise<{ data: any; error: AppError | null }> => {
    try {
      // Validate form data before submission
      if (!formData.vin || !formData.make || !formData.model) {
        const error = new AppError({
          message: 'Missing required vehicle information',
          code: ErrorCode.VALIDATION_ERROR,
          category: 'validation_error' as ErrorCategory,
          severity: ErrorSeverity.ERROR
        });
        return { data: null, error };
      }

      // Prepare data for submission
      const submissionData = {
        ...formData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Submit to database
      const { data, error } = await supabase
        .from('cars')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        const appError = new AppError({
          message: error.message,
          code: ErrorCode.SUBMISSION_ERROR,
          category: 'technical_error' as ErrorCategory,
          severity: ErrorSeverity.ERROR
        });
        return { data: null, error: appError };
      }

      return { data, error: null };
    } catch (error: any) {
      const appError = new AppError({
        message: error.message || 'Unknown submission error',
        code: ErrorCode.UNKNOWN_ERROR,
        category: 'technical_error' as ErrorCategory,
        severity: ErrorSeverity.ERROR
      });
      return { data: null, error: appError };
    }
  },

  updateFormData: async (
    formData: CarListingFormData,
    carId: string
  ): Promise<{ data: any; error: AppError | null }> => {
    try {
      // Validate form data before submission
      if (!formData.vin || !formData.make || !formData.model) {
        // Convert ValidationSubmissionError to AppError format
        const error = new AppError({
          message: 'Missing required vehicle information',
          code: ErrorCode.VALIDATION_ERROR,
          category: 'validation_error' as ErrorCategory,
          severity: ErrorSeverity.ERROR
        });
        return { data: null, error };
      }

      // Prepare data for update
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { data, error } = await supabase
        .from('cars')
        .update(updateData)
        .eq('id', carId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: new AppError({
            message: error.message,
            code: ErrorCode.SUBMISSION_ERROR,
            category: 'technical_error' as ErrorCategory,
            severity: ErrorSeverity.ERROR
          })
        };
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: new AppError({
          message: error.message || 'Unknown submission error',
          code: ErrorCode.UNKNOWN_ERROR,
          category: 'technical_error' as ErrorCategory,
          severity: ErrorSeverity.ERROR
        })
      };
    }
  },

  deleteFormData: async (
    carId: string
  ): Promise<{ data: any; error: AppError | null }> => {
    try {
      // Delete from database
      const { data, error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: new AppError({
            message: error.message,
            code: ErrorCode.SUBMISSION_ERROR,
            category: 'technical_error' as ErrorCategory,
            severity: ErrorSeverity.ERROR
          })
        };
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: new AppError({
          message: error.message || 'Unknown submission error',
          code: ErrorCode.UNKNOWN_ERROR,
          category: 'technical_error' as ErrorCategory,
          severity: ErrorSeverity.ERROR
        })
      };
    }
  }
};
