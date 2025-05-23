
/**
 * Car listing form types
 * Created: 2025-07-12
 * Updated: 2025-07-18: Fixed missing exports and enum definitions
 * Updated: 2025-05-06: Ensured type compatibility with TransactionType
 * Updated: 2025-05-07: Added missing TransactionType enum values
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
  QUERY = 'query',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication'
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
