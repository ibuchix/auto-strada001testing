
/**
 * Created: 2025-08-25
 * Type guards for various data types
 */

import { CarFeatures } from "@/types/forms";

export function isCarFeature(key: string): boolean {
  const knownFeatures = [
    'satNav',
    'panoramicRoof',
    'reverseCamera',
    'heatedSeats',
    'upgradedSound',
    'bluetooth',
    'leatherSeats',
    'parkingSensors',
    'adaptiveCruiseControl',
    'navigationSystem',
    'headupDisplay',
    'keylessEntry',
    'startStop'
  ];
  
  return knownFeatures.includes(key);
}

export function isValidCarFeatures(features: any): features is CarFeatures {
  if (!features || typeof features !== 'object') return false;
  
  // Check if it has at least one of the expected properties
  return Object.keys(features).some(key => isCarFeature(key));
}
