
/**
 * Form steps configuration
 * Created: 2025-06-05
 */

import { CarListingFormData } from "@/types/forms";

export interface FormStepConfig {
  id: string;
  title: string;
  description?: string;
  sections: string[];
  validate?: (data: CarListingFormData) => boolean;
}

export const formSteps: FormStepConfig[] = [
  {
    id: "vehicle-details",
    title: "Vehicle Details",
    description: "Enter the basic information about your vehicle",
    sections: ["vehicle-info"]
  },
  {
    id: "condition-status",
    title: "Vehicle Condition & Status",
    description: "Tell us about the condition of your vehicle",
    sections: ["vehicle-status", "damage-details"]
  },
  {
    id: "features-history",
    title: "Features & History",
    description: "Share information about the features and service history",
    sections: ["features", "service-history"]
  },
  {
    id: "photos",
    title: "Vehicle Photos",
    description: "Upload photos of your vehicle",
    sections: ["images"]
  },
  {
    id: "seller-info",
    title: "Seller Information",
    description: "Provide your contact information",
    sections: ["personal-details"]
  }
];
