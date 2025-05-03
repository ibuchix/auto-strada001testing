
/**
 * Car listing form types
 * Created: 2025-07-12
 */

import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  sections: string[];
}

export interface TransactionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
  showToast?: boolean;
}

export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query'
}

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface FormContentProps {
  session: any;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

export interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData?: () => void;
  handleReset?: () => void;
}
