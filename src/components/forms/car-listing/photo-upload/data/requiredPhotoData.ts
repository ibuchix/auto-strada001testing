
/**
 * Data for required photo sections
 * - 2025-04-05: Updated to use imported PhotoItem interface
 */
import { PhotoItem } from "../components/PhotoSection";

export const exteriorPhotos: PhotoItem[] = [
  {
    id: "exterior_front",
    title: "Front Exterior",
    description: "Front view showing headlights and grille",
    required: true
  },
  {
    id: "exterior_rear",
    title: "Rear Exterior",
    description: "Rear view showing taillights and bumper",
    required: true
  },
  {
    id: "exterior_driver",
    title: "Driver Side",
    description: "Full side view from driver's side",
    required: true
  },
  {
    id: "exterior_passenger",
    title: "Passenger Side",
    description: "Full side view from passenger's side",
    required: true
  },
];

export const interiorPhotos: PhotoItem[] = [
  {
    id: "interior_front",
    title: "Front Interior",
    description: "Front seats and dashboard",
    required: true
  },
  {
    id: "interior_rear",
    title: "Rear Interior",
    description: "Rear seats and legroom",
    required: true
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Clear view of dash and controls",
    required: true
  },
  {
    id: "odometer",
    title: "Odometer",
    description: "Current mileage reading",
    required: true
  },
];

// Combine all photo arrays for validation
export const allRequiredPhotos = [...exteriorPhotos, ...interiorPhotos];
