export type DamageType = 'scratches' | 'dents' | 'paintwork' | 'windscreen';

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