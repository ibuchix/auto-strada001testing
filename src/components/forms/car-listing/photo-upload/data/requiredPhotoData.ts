
/**
 * Data for required photo sections
 */
import { PhotoItem } from "../components/PhotoSection";

export const exteriorPhotos: PhotoItem[] = [
  {
    id: "exterior_front",
    title: "Front Exterior",
    description: "Front view showing headlights and grille",
  },
  {
    id: "exterior_rear",
    title: "Rear Exterior",
    description: "Rear view showing taillights and bumper",
  },
  {
    id: "exterior_driver",
    title: "Driver Side",
    description: "Full side view from driver's side",
  },
  {
    id: "exterior_passenger",
    title: "Passenger Side",
    description: "Full side view from passenger's side",
  },
];

export const interiorPhotos: PhotoItem[] = [
  {
    id: "interior_front",
    title: "Front Interior",
    description: "Front seats and dashboard",
  },
  {
    id: "interior_rear",
    title: "Rear Interior",
    description: "Rear seats and legroom",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Clear view of dash and controls",
  },
  {
    id: "odometer",
    title: "Odometer",
    description: "Current mileage reading",
  },
];

// Combine all photo arrays for validation
export const allRequiredPhotos = [...exteriorPhotos, ...interiorPhotos];
