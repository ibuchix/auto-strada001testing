
import { CarFeatures } from "@/types/forms";

export const isCarFeatures = (obj: unknown): obj is CarFeatures => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const features = obj as Record<string, unknown>;
  return (
    typeof features.satNav === 'boolean' &&
    typeof features.panoramicRoof === 'boolean' &&
    typeof features.reverseCamera === 'boolean' &&
    typeof features.heatedSeats === 'boolean' &&
    typeof features.upgradedSound === 'boolean' &&
    typeof features.bluetooth === 'boolean' &&
    typeof features.sunroof === 'boolean' &&
    typeof features.alloyWheels === 'boolean'
  );
};

export const getDefaultCarFeatures = (): CarFeatures => ({
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false,
  bluetooth: false,
  sunroof: false,
  alloyWheels: false
});
