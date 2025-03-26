
/**
 * Changes made:
 * - 2025-12-05: Updated DamageType to include all types from main types file
 */

export type DamageType = 'scratches' | 'dents' | 'paintwork' | 'windscreen' | 'bodywork' | 'mechanical' | 'electrical' | 'interior' | 'glass' | 'other';

export interface DamageReport {
  type: DamageType;
  description: string;
  photoPath?: string;
}

export interface RimPhotos {
  front_left: string | null;
  front_right: string | null;
  rear_left: string | null;
  rear_right: string | null;
}
