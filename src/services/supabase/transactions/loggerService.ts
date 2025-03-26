
/**
 * Created: 2025-08-25
 * Logger service for transaction tracking
 */

import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { TransactionDetails } from './types';

// Define the SystemLogRecord interface
export interface SystemLogRecord {
  id: string;
  created_at: string;
  log_type: string;
  message: string;
  details: Record<string, any>;
  correlation_id: string;
  error_message: string;
}

// This function will fetch transaction logs by ID
export async function fetchTransactionLogs(transactionId: string): Promise<TransactionDetails | null> {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('correlation_id', transactionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching transaction logs:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Convert database records to TransactionDetails
    return mapLogsToTransaction(data as SystemLogRecord[]);
  } catch (error) {
    console.error('Exception fetching transaction logs:', error);
    return null;
  }
}

// Map system logs to a transaction details object
function mapLogsToTransaction(logs: SystemLogRecord[]): TransactionDetails {
  // Find the main transaction record
  const transactionRecord = logs.find(log => log.log_type === 'TRANSACTION_START');
  
  if (!transactionRecord) {
    throw new Error('No transaction start record found in logs');
  }
  
  const details: TransactionDetails = {
    id: transactionRecord.correlation_id,
    name: transactionRecord.message,
    type: transactionRecord.details.type,
    status: determineTransactionStatus(logs),
    startTime: transactionRecord.created_at,
    steps: [],
    metadata: transactionRecord.details.metadata || {}
  };
  
  // Find the end record if it exists
  const endRecord = logs.find(log => log.log_type === 'TRANSACTION_END');
  if (endRecord) {
    details.endTime = endRecord.created_at;
    details.duration = calculateDuration(
      new Date(transactionRecord.created_at),
      new Date(endRecord.created_at)
    );
  }
  
  // Find error record if it exists
  const errorRecord = logs.find(log => log.log_type === 'TRANSACTION_ERROR');
  if (errorRecord) {
    details.error = {
      message: errorRecord.error_message,
      details: errorRecord.details
    };
  }
  
  // Collect all step records
  const stepRecords = logs.filter(log => 
    log.log_type === 'STEP_START' || 
    log.log_type === 'STEP_END' || 
    log.log_type === 'STEP_ERROR'
  );
  
  // Group steps by their ID
  const stepGroups: Record<string, SystemLogRecord[]> = {};
  stepRecords.forEach(record => {
    const stepId = record.details.stepId;
    if (!stepGroups[stepId]) {
      stepGroups[stepId] = [];
    }
    stepGroups[stepId].push(record);
  });
  
  // Process each step group
  Object.values(stepGroups).forEach(stepGroup => {
    const step = processStepRecords(stepGroup);
    if (step) {
      details.steps.push(step);
    }
  });
  
  return details;
}

// Process a group of records for a single step
function processStepRecords(records: SystemLogRecord[]): TransactionStep | null {
  const startRecord = records.find(r => r.log_type === 'STEP_START');
  if (!startRecord) return null;
  
  const step: TransactionStep = {
    id: startRecord.details.stepId,
    name: startRecord.message,
    status: 'pending',
    startTime: startRecord.created_at,
    metadata: startRecord.details.metadata || {}
  };
  
  const endRecord = records.find(r => r.log_type === 'STEP_END');
  if (endRecord) {
    step.endTime = endRecord.created_at;
    step.status = 'success';
    step.duration = calculateDuration(
      new Date(startRecord.created_at),
      new Date(endRecord.created_at)
    );
  }
  
  const errorRecord = records.find(r => r.log_type === 'STEP_ERROR');
  if (errorRecord) {
    step.status = 'error';
    step.error = {
      message: errorRecord.error_message,
      details: errorRecord.details
    };
  }
  
  return step;
}

// Helper to determine overall transaction status
function determineTransactionStatus(logs: SystemLogRecord[]): TransactionStatus {
  if (logs.some(log => log.log_type === 'TRANSACTION_ERROR')) {
    return 'error';
  }
  
  if (logs.some(log => log.log_type === 'TRANSACTION_ROLLBACK')) {
    return 'rollback';
  }
  
  if (logs.some(log => log.log_type === 'TRANSACTION_END')) {
    return 'success';
  }
  
  return 'pending';
}

// Helper to calculate duration between two dates in milliseconds
function calculateDuration(start: Date, end: Date): number {
  return end.getTime() - start.getTime();
}

// Define TransactionStep interface locally to avoid dependency issues
interface TransactionStep {
  id: string;
  name: string;
  status: 'idle' | 'pending' | 'success' | 'error' | 'rollback';
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: any;
  metadata?: Record<string, any>;
}
